type Props = {
  page: number;
  totalPages: number;
  onChange: (next: number) => void;
};

export default function Pagination({ page, totalPages, onChange }: Props) {
  return (
    <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-black text-white/60">
        Page <span className="text-white">{page}</span> / {totalPages}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white/90 transition hover:bg-white/5 disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white/90 transition hover:bg-white/5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}