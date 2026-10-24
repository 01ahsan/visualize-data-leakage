import { CopyButton } from './CopyButton';

interface CodePanelsProps {
  wrongCode: string;
  rightCode: string;
}

/** Lines of `code` marked when they do not appear in `other`. */
function markLines(code: string, other: string) {
  const otherLines = new Set(other.split('\n').map((l) => l.trim()));
  return code.split('\n').map((line) => ({ line, changed: !otherLines.has(line.trim()) }));
}

function Panel({
  title,
  kind,
  code,
  other,
}: {
  title: string;
  kind: 'wrong' | 'right';
  code: string;
  other: string;
}) {
  return (
    <figure className={`code-panel code-${kind}`}>
      <figcaption className="code-head">
        <span className="code-title">
          <span className="code-badge" aria-hidden="true">
            {kind === 'wrong' ? '✗' : '✓'}
          </span>
          {title}
        </span>
        <CopyButton text={code} label="Copy" />
      </figcaption>
      <pre tabIndex={0} aria-label={`${title}, Python code`}>
        <code>
          {markLines(code, other).map(({ line, changed }, i) => (
            <span key={i} className={changed ? 'code-line changed' : 'code-line'}>
              {line || ' '}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

export function CodePanels({ wrongCode, rightCode }: CodePanelsProps) {
  return (
    <>
      <p className="muted small">
        Both snippets run as they are with NumPy and scikit-learn. Highlighted lines differ between
        the two.
      </p>
      <div className="code-grid">
        <Panel title="Leaky" kind="wrong" code={wrongCode} other={rightCode} />
        <Panel title="Correct" kind="right" code={rightCode} other={wrongCode} />
      </div>
    </>
  );
}
