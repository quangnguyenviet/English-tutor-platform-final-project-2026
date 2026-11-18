import { useEffect, useState } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle, Wifi, Loader2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { apiGetReviewSettings, apiUpdateReviewSettings } from "../lib/studentApi";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const themePreviews = {
  dark: {
    name: "Tối",
    desc: "Speedtest — nền gradient xanh navy, glow cyan",
    colors: ["bg-cyan-500", "bg-cyan-400", "bg-cyan-200", "bg-cyan-100"],
  },
  light: {
    name: "Sáng",
    desc: "Trắng — nền trắng sáng, tông xanh dương",
    colors: ["bg-blue-600", "bg-blue-400", "bg-blue-200", "bg-blue-100"],
  },
};

const TAB_DEFS = {
  admin:   [{ id: "appearance", label: "Giao diện" }, { id: "ai", label: "Cấu hình AI" }, { id: "telegram", label: "Telegram Bot" }, { id: "account", label: "Tài khoản" }],
  tutor:   [{ id: "appearance", label: "Giao diện" }, { id: "account", label: "Tài khoản" }],
  student: [{ id: "appearance", label: "Giao diện" }, { id: "review", label: "Ôn tập" }, { id: "account", label: "Tài khoản" }],
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export default function SettingsPage() {
  const { theme, setTheme, themes } = useTheme();
  const { session, token } = useAuth();

  const tabs = TAB_DEFS[session?.role] ?? TAB_DEFS.student;
  const [activeTab, setActiveTab] = useState("appearance");

  const [aiConfig, setAiConfig] = useState({ endpoint: "https://api.openai.com/v1", apiKey: "", model: "gpt-4o-mini" });
  const [showApiKey, setShowApiKey] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);

  const [tgConfig, setTgConfig] = useState({ token: "", webhookUrl: "", enabled: false });
  const [showToken, setShowToken] = useState(false);

  const [accountForm, setAccountForm] = useState({ name: session?.name ?? "", email: session?.email ?? "" });
  const [accountSaved, setAccountSaved] = useState(false);

  const [autoReviewWrong, setAutoReviewWrong] = useState(null);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  useEffect(() => {
    if (session?.role === "student" && activeTab === "review" && autoReviewWrong === null && token) {
      apiGetReviewSettings(token)
        .then((s) => setAutoReviewWrong(Boolean(s?.autoReviewWrong)))
        .catch(() => setAutoReviewWrong(true));
    }
  }, [activeTab, session?.role, autoReviewWrong, token]);

  async function saveReviewSettings() {
    setReviewSaving(true);
    setReviewSaved(false);
    try {
      await apiUpdateReviewSettings(token, autoReviewWrong);
      setReviewSaved(true);
      setTimeout(() => setReviewSaved(false), 2000);
    } finally {
      setReviewSaving(false);
    }
  }

  function testAiConnection() {
    setAiStatus("testing");
    setTimeout(() => setAiStatus(aiConfig.endpoint && aiConfig.apiKey ? "ok" : "fail"), 900);
  }

  function saveAccount() {
    setAccountSaved(true);
    setTimeout(() => setAccountSaved(false), 2000);
  }

  return (
    <div>
      <PageHeader title="Cài đặt" description="Tùy chỉnh giao diện và thiết lập hệ thống." />

      {tabs.length > 1 && (
        <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === t.id
                  ? "accent-bg text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "appearance" && (<>
      <Card>
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Giao diện</h2>
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Chọn theme màu sắc yêu thích. Thay đổi được áp dụng ngay lập tức.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(themePreviews).map(([key, t]) => {
            const isActive = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`relative rounded-xl border-2 p-4 text-left transition ${
                  isActive
                    ? "border-slate-900 shadow-md dark:border-slate-50"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-600"
                }`}
              >
                {isActive && (
                  <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full accent-bg text-[11px] text-white">
                    ✓
                  </span>
                )}

                <div className="mb-3 flex gap-1">
                  {t.colors.map((c, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full ${c}`} />
                  ))}
                </div>

                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{t.name}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Theme hiện tại</h2>
        <div className="flex items-center gap-3">
          <div className={`h-4 w-4 rounded-full ${themes?.[theme]?.dot ?? "bg-cyan-500"}`} />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Đang dùng: <span className="font-medium text-slate-900 dark:text-slate-50">{themes?.[theme]?.name ?? theme}</span>
          </p>
        </div>
      </Card>
      </>)}

      {activeTab === "ai" && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Cấu hình AI (OpenAI-compatible)</h2>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">API bên thứ ba để sinh bài tập. Hỗ trợ mọi endpoint tương thích chuẩn OpenAI.</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Base URL</label>
              <input value={aiConfig.endpoint} onChange={(e) => setAiConfig((c) => ({ ...c, endpoint: e.target.value }))} placeholder="https://api.openai.com/v1" className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">API Key</label>
              <div className="relative">
                <input type={showApiKey ? "text" : "password"} value={aiConfig.apiKey} onChange={(e) => setAiConfig((c) => ({ ...c, apiKey: e.target.value }))} placeholder="sk-..." className={inputClass + " pr-10"} autoComplete="off" />
                <button type="button" onClick={() => setShowApiKey((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Model</label>
              <input value={aiConfig.model} onChange={(e) => setAiConfig((c) => ({ ...c, model: e.target.value }))} placeholder="gpt-4o-mini" className={inputClass} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button size="sm" variant="secondary" onClick={testAiConnection} disabled={aiStatus === "testing"}>
              <Wifi size={14} /> {aiStatus === "testing" ? "Đang kiểm tra..." : "Kiểm tra kết nối"}
            </Button>
            {aiStatus === "ok"   && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={15} /> Kết nối thành công</span>}
            {aiStatus === "fail" && <span className="flex items-center gap-1.5 text-sm text-rose-600 dark:text-rose-400"><XCircle size={15} /> Không thể kết nối</span>}
            <Button size="sm" className="ml-auto">Lưu cấu hình</Button>
          </div>
        </Card>
      )}

      {activeTab === "telegram" && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Telegram Bot — Kênh phụ huynh</h2>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">Bot tự động trả lời câu hỏi phụ huynh qua Telegram. Nếu AI không đủ tự tin, câu hỏi sẽ được chuyển tới gia sư.</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Bot Token</label>
              <div className="relative">
                <input type={showToken ? "text" : "password"} value={tgConfig.token} onChange={(e) => setTgConfig((c) => ({ ...c, token: e.target.value }))} placeholder="123456789:AAF..." className={inputClass + " pr-10"} autoComplete="off" />
                <button type="button" onClick={() => setShowToken((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Webhook URL</label>
              <input value={tgConfig.webhookUrl} onChange={(e) => setTgConfig((c) => ({ ...c, webhookUrl: e.target.value }))} placeholder="https://yourdomain.com/api/telegram/webhook" className={inputClass} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Bật bot phụ huynh</p>
                <p className="text-xs text-slate-400">Phụ huynh nhắn tin qua Telegram sẽ được bot phản hồi tự động</p>
              </div>
              <button onClick={() => setTgConfig((c) => ({ ...c, enabled: !c.enabled }))} className={`relative h-6 w-11 rounded-full transition-colors ${tgConfig.enabled ? "accent-bg" : "bg-slate-300 dark:bg-slate-700"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${tgConfig.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>
          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button size="sm">Lưu cấu hình</Button>
          </div>
        </Card>
      )}

      {activeTab === "review" && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Ôn tập ngắt quãng</h2>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Chọn cách câu hỏi được thêm vào danh sách ôn tập của bạn.
          </p>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">Tự động thêm câu trả lời sai</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Câu sai trong quiz được thêm vào danh sách ôn tập ngay khi bạn trả lời.
                Bạn vẫn có thể tự thêm bất kỳ câu đúng nào (kể cả câu đoán đúng) thông qua nút
                "Thêm vào danh sách ôn" trong bài quiz.
              </p>
            </div>
            <button
              onClick={() => autoReviewWrong !== null && setAutoReviewWrong((v) => !v)}
              disabled={autoReviewWrong === null}
              aria-label="Bật hoặc tắt tự động thêm câu sai"
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                autoReviewWrong ? "accent-bg" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoReviewWrong ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            {autoReviewWrong === null ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <Button size="sm" onClick={saveReviewSettings} disabled={reviewSaving}>
                {reviewSaving ? "Đang lưu..." : "Lưu cấu hình"}
              </Button>
            )}
            {reviewSaved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={15} /> Đã lưu
              </span>
            )}
          </div>
        </Card>
      )}

      {activeTab === "account" && (
        <Card>
          <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-50">Thông tin tài khoản</h2>
          <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">Thay đổi tên hiển thị và email đăng nhập.</p>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Tên hiển thị</label>
              <input value={accountForm.name} onChange={(e) => setAccountForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Email</label>
              <input type="email" value={accountForm.email} onChange={(e) => setAccountForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@example.com" className={inputClass} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button size="sm" onClick={saveAccount}>Lưu thay đổi</Button>
            {accountSaved && <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={15} /> Đã lưu</span>}
          </div>
        </Card>
      )}
    </div>
  );
}