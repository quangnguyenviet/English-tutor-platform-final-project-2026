import { Lock } from "lucide-react";
import Card from "../../../ui/Card";

/** Class chung cho input / select / textarea của form chỉnh sửa hồ sơ. */
export const INPUT_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";

/**
 * SectionCard — vỏ card chung cho 8 section của form chỉnh sửa.
 * Heading + icon lucide đồng nhất với chế độ xem.
 */
export function SectionCard({
  icon: Icon,
  iconClass = "text-blue-600 dark:text-blue-400",
  title,
  hint,
  children,
}) {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-5 h-5 ${iconClass}`} />
        <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {hint && (
        <p className="mb-4 mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      <div className={hint ? "" : "mt-4"}>{children}</div>
    </Card>
  );
}

export function FieldError({ error }) {
  if (!error) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
      {error}
    </p>
  );
}

/**
 * Field — nhãn + nội dung + lỗi cho một trường form.
 * Wrapper có id `field-<fieldId>` để scroll tới trường lỗi đầu tiên khi validate.
 */
export function Field({ fieldId, label, required, error, hint, children }) {
  return (
    <div id={fieldId ? `field-${fieldId}` : undefined} className="space-y-1.5">
      <label
        htmlFor={fieldId || undefined}
        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {!error && hint && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      )}
      <FieldError error={error} />
    </div>
  );
}

export function TextField({ fieldId, label, required, error, hint, className, ...inputProps }) {
  return (
    <Field fieldId={fieldId} label={label} required={required} error={error} hint={hint}>
      <input id={fieldId} className={`${INPUT_CLASS} ${className || ""}`} {...inputProps} />
    </Field>
  );
}

export function SelectField({
  fieldId,
  label,
  required,
  error,
  hint,
  className,
  children,
  ...selectProps
}) {
  return (
    <Field fieldId={fieldId} label={label} required={required} error={error} hint={hint}>
      <select id={fieldId} className={`${INPUT_CLASS} ${className || ""}`} {...selectProps}>
        {children}
      </select>
    </Field>
  );
}

export function TextAreaField({
  fieldId,
  label,
  required,
  error,
  hint,
  className,
  ...textareaProps
}) {
  return (
    <Field fieldId={fieldId} label={label} required={required} error={error} hint={hint}>
      <textarea
        id={fieldId}
        className={`${INPUT_CLASS} leading-relaxed ${className || ""}`}
        {...textareaProps}
      />
    </Field>
  );
}

/**
 * LockedField — trường bị khóa khi hồ sơ đã duyệt (ACTIVE).
 * Hiển thị giá trị read-only kèm icon khóa và chú thích theo plan.md §8.
 */
export function LockedField({ label, value }) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        {label}
        <Lock
          size={12}
          className="text-slate-400 dark:text-slate-500"
          aria-label="Trường bị khóa"
        />
      </span>
      <div
        title="Không thể chỉnh sửa sau khi hồ sơ đã duyệt"
        className="px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-500 dark:text-slate-400"
      >
        {value || "–"}
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Không thể chỉnh sửa sau khi hồ sơ đã duyệt
      </p>
    </div>
  );
}
