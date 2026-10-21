import { FileText, Link } from "lucide-react";
import Badge from "../../../ui/Badge";
import Card from "../../../ui/Card";

const TYPE_LABEL = {
  CERTIFICATE: "Chứng chỉ",
  AWARD: "Thành tích",
  DIPLOMA: "Bằng cấp",
  OTHER: "Khác",
};

/**
 * CredentialsSection — Chứng chỉ & thành tích (chế độ xem).
 * @param {Object[]} credentials - [{ title, type, score, fileUrl }]
 */
export default function CredentialsSection({ credentials = [] }) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white">
          Chứng chỉ & thành tích
        </h3>
      </div>

      {credentials.length > 0 ? (
        <div className="space-y-2">
          {credentials.map((cred, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {cred.title || "Chứng chỉ"}
                </span>
                <Badge
                  tone="amber"
                  size="xs"
                >
                  {TYPE_LABEL[cred.type] || cred.type || "Khác"}
                </Badge>
              </div>
              {cred.score && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  Điểm: {cred.score}
                </div>
              )}
              {cred.fileUrl && (
                <a
                  href={cred.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Link size={14} /> Tải file
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          Chưa có chứng chỉ.
        </p>
      )}
    </Card>
  );
}
