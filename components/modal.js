'use client';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-[#071426]/55 backdrop-blur-md" />
      <div className="glass fade-up relative w-full max-w-md p-6 shadow-[0_35px_90px_-35px_rgba(7,20,38,.65)]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="gold-text text-lg font-bold">{title}</h3>
          <button className="text-2xl leading-none text-gray-400 hover:text-white" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}