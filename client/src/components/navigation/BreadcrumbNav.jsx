import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export function BreadcrumbNav({ items = [], onBack, backLabel = 'Back' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs py-2 px-1">
      {onBack && (
        <button
          onClick={onBack}
          className="mr-2 inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
          title={backLabel}
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline font-medium">{backLabel}</span>
        </button>
      )}

      <ol className="flex items-center space-x-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const ItemIcon = item.icon;

          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <span className="text-slate-600 select-none" aria-hidden="true">
                  /
                </span>
              )}

              {isLast || !item.onClick ? (
                <span className={`flex items-center space-x-1.5 font-medium ${isLast ? 'text-white' : 'text-slate-400'}`}>
                  {ItemIcon && <ItemIcon className="h-3.5 w-3.5 text-blue-400" />}
                  <span className={item.isCode ? 'font-mono' : ''}>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono ml-1">
                      {item.badge}
                    </span>
                  )}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center space-x-1.5 text-slate-400 hover:text-blue-400 transition cursor-pointer"
                >
                  {ItemIcon && <ItemIcon className="h-3.5 w-3.5" />}
                  <span className={item.isCode ? 'font-mono' : ''}>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
