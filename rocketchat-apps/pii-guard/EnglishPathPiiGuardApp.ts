import {
  IAppAccessors,
  IConfigurationExtend,
  IHttp,
  ILogger,
  IPersistence,
  IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IMessage } from "@rocket.chat/apps-engine/definition/messages";
import { IPreMessageSentPrevent } from "@rocket.chat/apps-engine/definition/messages/IPreMessageSentPrevent";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import { SettingType } from "@rocket.chat/apps-engine/definition/settings";

import { hmacSha256Hex } from "./src/hmac";
import { detectPii } from "./src/piiDetector";

export class EnglishPathPiiGuardApp extends App implements IPreMessageSentPrevent {
  constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
    super(info, logger, accessors);
  }

  protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
    await configuration.settings.provideSetting({
      id: "backend_url",
      type: SettingType.STRING,
      packageValue: "",
      required: false,
      public: false,
      i18nLabel: "Backend URL",
      i18nDescription: "Địa chỉ backend EnglishPath, ví dụ http://backend:8080. Để trống thì không báo log.",
    });
    await configuration.settings.provideSetting({
      id: "hmac_secret",
      type: SettingType.PASSWORD,
      packageValue: "",
      required: false,
      public: false,
      i18nLabel: "HMAC secret",
      i18nDescription: "Khóa ký log gửi về /api/v1/internal/chat/pii-events (trùng MESSAGING_INTERNAL_HMAC_SECRET).",
    });
  }

  public async checkPreMessageSentPrevent(
    message: IMessage,
    _read: IRead,
    _http: IHttp,
  ): Promise<boolean> {
    return Boolean(message.text?.trim());
  }

  public async executePreMessageSentPrevent(
    message: IMessage,
    read: IRead,
    http: IHttp,
    _persistence: IPersistence,
  ): Promise<boolean> {
    const detection = detectPii(message.text);

    if (detection.blocked) {
      this.getLogger().warn(
        `Blocked contact information in room ${message.room.id}; types=${detection.types.join(",")}`,
      );
      await this.reportToBackend(message, detection.types, read, http);
    }

    return detection.blocked;
  }

  /** Báo log chặn PII về backend (HMAC); lỗi mạng không được làm hỏng việc chặn tin. */
  private async reportToBackend(
    message: IMessage,
    types: string[],
    read: IRead,
    http: IHttp,
  ): Promise<void> {
    try {
      const settings = read.getEnvironmentReader().getSettings();
      const backendUrl = String(await settings.getValueById("backend_url") || "").replace(/\/$/, "");
      const secret = String(await settings.getValueById("hmac_secret") || "");
      if (!backendUrl || !secret) return;

      const body = JSON.stringify({
        rocketRoomId: message.room.id,
        rocketUsername: message.sender.username,
        types,
        textLength: message.text?.length ?? 0,
      });
      await http.post(`${backendUrl}/api/v1/internal/chat/pii-events`, {
        headers: { "Content-Type": "application/json", "X-Signature": hmacSha256Hex(secret, body) },
        content: body,
      });
    } catch (error) {
      this.getLogger().warn(`Không báo được log PII về backend: ${String(error)}`);
    }
  }
}
