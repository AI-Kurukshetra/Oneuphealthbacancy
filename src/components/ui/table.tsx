import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
      <table className={`min-w-full text-left text-sm ${className}`}>{children}</table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-slate-500">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>;
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function TableHeader({ children, className = "", ...props }: { children: ReactNode } & ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${className}`} {...props}>{children}</th>;
}

export function TableCell({ children, className = "", ...props }: { children: ReactNode; className?: string } & TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`px-4 py-3 text-slate-700 ${className}`} {...props}>{children}</td>;
}
