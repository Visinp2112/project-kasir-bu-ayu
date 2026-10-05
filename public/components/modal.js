'use client';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="glass fade-up relative w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="gold-text text-lg font-bold">{title}</h3>
          <button className="text-2xl leading-none text-gray-400 hover:text-white" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}