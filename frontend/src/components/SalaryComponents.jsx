// Reusable form components for salary calculation

export function Field({ label, required, children, helpText, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && <p className="text-xs text-slate-500">{helpText}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

export function SummaryCard({ title, amount, type = 'default', icon }) {
  const styles = {
    default: 'bg-white border-slate-200',
    positive: 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200',
    negative: 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200',
    primary: 'bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200'
  };

  const textStyles = {
    default: 'text-slate-900',
    positive: 'text-emerald-700',
    negative: 'text-red-700',
    primary: 'text-primary-700'
  };

  return (
    <div className={`rounded-2xl border-2 ${styles[type]} p-6`}>
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className="text-lg">{icon}</div>}
        <h4 className="text-sm font-medium text-slate-600">{title}</h4>
      </div>
      <p className={`text-2xl font-bold ${textStyles[type]}`}>{amount}</p>
    </div>
  )
}

export function LoadingButton({ loading, children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8l4-4z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm placeholder-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all ${className}`}
      {...props}
    />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <select
      className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  )
}

export function SuccessMessage({ message }) {
  if (!message) return null;
  
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-emerald-700">{message}</p>
      </div>
    </div>
  )
}