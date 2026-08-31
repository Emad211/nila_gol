import './SectionHeading.css';

// Shared section heading for the figma-redesign landing (PLAN.md §1):
// pink eyebrow chip (icon + label) → B Arshia display title (accepts JSX for
// the mixed pink spans) → decorative accent underline → muted subtitle.
// Sizes/underline dimensions come from each section's spec sheet so this
// component stays presentational and pixel-faithful per call site.
function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  sub,
  underline = [83, 2],
  titleSize = 64,
  titleSizeMobile = 48,
  center = false,
}) {
  return (
    <div className={`nl-heading${center ? ' nl-heading--center' : ''}`}>
      {eyebrow && (
        <span className="nl-heading__chip">
          {Icon && <Icon aria-hidden="true" className="nl-heading__chip-icon" />}
          {eyebrow}
        </span>
      )}
      <h2
        className="nl-heading__title"
        style={{
          '--nl-title-size': `${titleSize}px`,
          '--nl-title-size-m': `${titleSizeMobile}px`,
        }}
      >
        {title}
      </h2>
      <span
        className="nl-heading__underline"
        style={{
          '--nl-underline-w': `${underline[0]}px`,
          '--nl-underline-h': `${underline[1]}px`,
        }}
        aria-hidden="true"
      />
      {sub && <p className="nl-heading__sub">{sub}</p>}
    </div>
  );
}

export default SectionHeading;
