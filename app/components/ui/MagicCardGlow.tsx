// Adapted from Magic UI Magic Card (MIT). Pointer coordinates are supplied by
// the site's shared spotlight controller instead of a second motion listener.
// See THIRD_PARTY_NOTICES.md.
import styles from './MagicCardGlow.module.css';

export default function MagicCardGlow() {
  return <span aria-hidden="true" className={styles.glow} />;
}
