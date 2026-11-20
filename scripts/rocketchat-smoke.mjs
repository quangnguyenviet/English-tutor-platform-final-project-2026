import process from "node:process";

const baseUrl = (process.env.ROCKETCHAT_ROOT_URL || "http://localhost:3001").replace(/\/$/, "");
const wsUrl = baseUrl.replace(/^http/, "ws") + "/websocket";
const adminUsername = process.env.ROCKETCHAT_ADMIN_USERNAME || "ep_admin";
const adminPassword = process.env.ROCKETCHAT_ADMIN_PASSWORD || "ChangeMe123!";
const tokenSecret = process.env.ROCKETCHAT_CREATE_TOKENS_SECRET || "dev-only-change-me";
const expectPiiGuard = process.env.ROCKETCHAT_EXPECT_PII_GUARD === "true";

const parent = {
  username: "ep_spike_parent",
  name: "Phụ huynh Spike",
  email: "spike.parent@englishpath.local",
  password: "SpikeParent123!",
};
const tutor = {
  username: "ep_spike_tutor",
  name: "Gia sư Spike",
  email: "spike.tutor@englishpath.local",
  password: "SpikeTutor123!",
};

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(path, { method = "GET", auth, body, allowFailure = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    headers["X-User-Id"] = auth.userId;
    headers["X-Auth-Token"] = auth.authToken;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok && !allowFailure) {
    throw new Error(`${method} ${path} failed (${response.status}): ${payload.error || payload.message || "unknown error"}`);
  }

  return { response, payload };
}

async function waitForRocketChat() {
  for (let attempt = 1; attempt <= 90; attempt += 1) {
    try {
      const { response } = await request("/api/info", { allowFailure: true });
      if (response.ok) return;
    } catch {
      // Rocket.Chat chưa mở cổng trong lúc khởi động.
    }
    await sleep(2_000);
  }
  throw new Error(`Rocket.Chat did not become ready at ${baseUrl}`);
}

async function login(username, password) {
  const { payload } = await request("/api/v1/login", {
    method: "POST",
    body: { user: username, password },
  });
  return { userId: payload.data.userId, authToken: payload.data.authToken };
}

async function ensureUser(adminAuth, user) {
  const info = await request(`/api/v1/users.info?username=${encodeURIComponent(user.username)}`, {
    auth: adminAuth,
    allowFailure: true,
  });
  if (info.response.ok) return info.payload.user;

  const created = await request("/api/v1/users.create", {
    method: "POST",
    auth: adminAuth,
    body: {
      username: user.username,
      name: user.name,
      email: user.email,
      password: user.password,
      active: true,
      verified: true,
      joinDefaultChannels: false,
      sendWelcomeEmail: false,
      requirePasswordChange: false,
    },
  });
  return created.payload.user;
}

async function createTemporaryToken(adminAuth, rocketUserId) {
  const { payload } = await request("/api/v1/users.createToken", {
    method: "POST",
    auth: adminAuth,
    body: { userId: rocketUserId, secret: tokenSecret },
  });
  return payload.data;
}

function waitForSocketMessage(socket, predicate, label, timeoutMs = 15_000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", onMessage);
      reject(new Error(`Timed out waiting for websocket event: ${label}`));
    }, timeoutMs);

    function onMessage(event) {
      const message = JSON.parse(event.data);
      if (message.msg === "ping") {
        socket.send(JSON.stringify({ msg: "pong" }));
        return;
      }
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", onMessage);
      resolve(message);
    }

    socket.addEventListener("message", onMessage);
  });
}

async function verifyRealtime(parentAuth, tutorAuth, roomId) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let pending = waitForSocketMessage(socket, (message) => message.msg === "connected", "DDP connected");
  socket.send(JSON.stringify({ msg: "connect", version: "1", support: ["1"] }));
  await pending;

  pending = waitForSocketMessage(socket, (message) => message.id === "login" && message.msg === "result", "DDP login");
  socket.send(JSON.stringify({
    msg: "method",
    method: "login",
    id: "login",
    params: [{ resume: parentAuth.authToken }],
  }));
  await pending;

  pending = waitForSocketMessage(socket, (message) => message.msg === "ready" && message.subs?.includes("room-stream"), "room subscription");
  socket.send(JSON.stringify({
    msg: "sub",
    id: "room-stream",
    name: "stream-room-messages",
    params: [roomId, false],
  }));
  await pending;

  const marker = `realtime-${Date.now()}`;
  pending = waitForSocketMessage(
    socket,
    (message) => message.msg === "changed"
      && message.collection === "stream-room-messages"
      && message.fields?.args?.[0]?.msg === marker,
    "realtime message",
  );
  await request("/api/v1/chat.sendMessage", {
    method: "POST",
    auth: tutorAuth,
    body: { message: { rid: roomId, msg: marker } },
  });
  await pending;
  socket.close();
  return marker;
}

async function main() {
  await waitForRocketChat();
  const adminAuth = await login(adminUsername, adminPassword);
  const parentUser = await ensureUser(adminAuth, parent);
  const tutorUser = await ensureUser(adminAuth, tutor);

  const temporaryParentAuth = await createTemporaryToken(adminAuth, parentUser._id);
  const tutorAuth = await login(tutor.username, tutor.password);

  const dm = await request("/api/v1/dm.create", {
    method: "POST",
    auth: temporaryParentAuth,
    body: { username: tutor.username },
  });
  const roomId = dm.payload.room.rid || dm.payload.room._id;

  const validText = `EnglishPath Rocket.Chat smoke ${Date.now()}`;
  await request("/api/v1/chat.sendMessage", {
    method: "POST",
    auth: temporaryParentAuth,
    body: { message: { rid: roomId, msg: validText } },
  });

  const history = await request(`/api/v1/dm.history?roomId=${encodeURIComponent(roomId)}&count=20`, {
    auth: temporaryParentAuth,
  });
  if (!history.payload.messages?.some((message) => message.msg === validText)) {
    throw new Error("Message was sent but not found in DM history");
  }

  const realtimeMarker = await verifyRealtime(temporaryParentAuth, tutorAuth, roomId);

  let piiGuard = "not-requested";
  if (expectPiiGuard) {
    const blocked = await request("/api/v1/chat.sendMessage", {
      method: "POST",
      auth: temporaryParentAuth,
      body: { message: { rid: roomId, msg: "Email của tôi là parent@example.com" } },
      allowFailure: true,
    });
    if (blocked.response.ok) throw new Error("PII Guard was expected, but Rocket.Chat accepted an email address");
    piiGuard = "blocked";
  }

  console.log(JSON.stringify({
    status: "ok",
    rocketChat: baseUrl,
    parentUserId: parentUser._id,
    tutorUserId: tutorUser._id,
    temporaryTokenCreated: Boolean(temporaryParentAuth.authToken),
    roomId,
    history: "ok",
    realtime: realtimeMarker,
    piiGuard,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
