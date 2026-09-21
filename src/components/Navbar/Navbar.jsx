import React from 'react';
import GithubIcon from '@/assets/icons/GithubIcon';
import { siteConfig } from '@/config/site';
import styles from './Navbar.module.css';

/**
 * Navbar Component
 * Renders the brand logo and GitHub repository link.
 */
export default function Navbar() {
  return (
    <header className={styles.navContainer}>
      <div className={styles.navWrapper}>
        <div className={styles.navButtons}>
          <div className={styles.leftSection}>
            <div className={styles.logo}>
              <h1 className={styles.logoTitle}>
                Play<span className={styles.highlight}>Z</span>
              </h1>
            </div>
          </div>
          <div className={styles.rightSection}>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubLink}
              aria-label="GitHub Repository"
            >
              <GithubIcon size={28} />
            </a>
          </div>
        </div>
        <div className={styles.navIndicator}></div>
      </div>
    </header>
  );
}
