import { MessageCircle, Video } from "lucide-react";
import Card from "../../../ui/Card";
import {
  SectionCard,
  TextField,
  FieldError,
  INPUT_CLASS,
} from "./EditFields";

/**
 * IntroSection — Giới thiệu & video (chế độ xem).
 * @param {Object} data
 */
export default function IntroSection({ bio, videoUrl }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Giới thiệu
        </h3>
      </div>

      {bio ? (
        <div className="prose prose-sm dark:prose-invert text-slate-600 dark:text-slate-300 leading-relaxed">
          {bio}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có mô tả giới thiệu.
        </p>
      )}

      {videoUrl && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
              Video giới thiệu
            </span>
          </div>
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <Video size={16} className="shrink-0" /> Xem video
          </a>
        </div>
      )}
    </Card>
  );
}

/**
 * IntroSectionEdit — Giới thiệu & video (chế độ sửa).
 */
export function IntroSectionEdit({ form, onChange, errors = {} }) {
  return (
    <SectionCard
      icon={MessageCircle}
      iconClass="text-indigo-600 dark:text-indigo-400"
      title="Giới thiệu & video"
    >
      <div className="space-y-4">
        <div id="field-bio" className="space-y-1.5">
          <label
            htmlFor="bio"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Giới thiệu bản thân <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="bio"
            rows={4}
            value={form.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            maxLength={500}
            placeholder="VD: Mình là sinh viên năm 3 Sư phạm Anh, có 2 năm kinh nghiệm dạy tiếng Anh..."
            className={`${INPUT_CLASS} resize-none`}
          />
          <div className="flex items-start justify-between gap-2">
            <FieldError error={errors.bio} />
            <p className="text-xs text-slate-400 ml-auto shrink-0">
              {(form.bio || "").length}/500
            </p>
          </div>
        </div>

        <TextField
          fieldId="videoUrl"
          type="url"
          label="Link video giới thiệu"
          value={form.videoUrl}
          onChange={(e) => onChange("videoUrl", e.target.value)}
          placeholder="VD: https://www.youtube.com/watch?v=..."
          hint="Dán link video YouTube / TikTok giới thiệu bản thân hoặc bài giảng mẫu."
        />
      </div>
    </SectionCard>
  );
}
