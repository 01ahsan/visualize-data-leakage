import { useState } from 'react';

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers or contexts without the async clipboard API.
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

interface CopyButtonProps {
  text: string;
  label: string;
  className?: string;
}

export function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const onClick = async () => {
    setState((await copyText(text)) ? 'copied' : 'failed');
    window.setTimeout(() => setState('idle'), 1800);
  };
  return (
    <button type="button" className={`button button-small ${className}`} onClick={onClick}>
      {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label}
      <span className="visually-hidden" aria-live="polite">
        {state === 'copied' ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
