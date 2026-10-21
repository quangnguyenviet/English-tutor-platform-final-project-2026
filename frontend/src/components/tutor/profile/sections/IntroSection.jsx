import { MessageCircle, Video } from "lucide-react";
import Card from "../../../ui/Card";

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
