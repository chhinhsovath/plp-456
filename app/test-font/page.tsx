'use client';

import styles from './test-font.module.css';

export default function TestFontPage() {
  return (
    <div className={styles.container}>
      <h1>Hanuman Font Test Page</h1>
      
      <div className={styles.section}>
        <h2>Font Weights Test</h2>
        <p className="khmer-thin">ពុម្ពអក្សរហនុមាន - Thin (100)</p>
        <p className="khmer-light">ពុម្ពអក្សរហនុមាន - Light (300)</p>
        <p className="khmer-regular">ពុម្ពអក្សរហនុមាន - Regular (400)</p>
        <p className="khmer-bold">ពុម្ពអក្សរហនុមាន - Bold (700)</p>
        <p className="khmer-black">ពុម្ពអក្សរហនុមាន - Black (900)</p>
      </div>

      <div className={styles.section}>
        <h2>Form Labels (as used in observation forms)</h2>
        <label className="khmer-text">ខេត្ត/ក្រុង*</label>
        <br />
        <label className="khmer-text">ស្រុក/ខណ្ឌ*</label>
        <br />
        <label className="khmer-text">ឃុំ/សង្កាត់</label>
        <br />
        <label className="khmer-text">ភូមិ</label>
      </div>

      <div className={styles.section}>
        <h2>Mixed Content</h2>
        <p>Official / មន្ត្រី</p>
        <p>Contract / កិច្ចសន្យា</p>
        <p>Volunteer / ស្ម័គ្រចិត្ត</p>
        <p>Morning / ព្រឹក</p>
        <p>Afternoon / រសៀល</p>
        <p>Full Day / ពេញមួយថ្ងៃ</p>
      </div>

      <div className={styles.section}>
        <h2>Province Names</h2>
        <ul>
          <li className="khmer-text">បន្ទាយមានជ័យ</li>
          <li className="khmer-text">បាត់ដំបង</li>
          <li className="khmer-text">កំពង់ចាម</li>
          <li className="khmer-text">កំពង់ឆ្នាំង</li>
          <li className="khmer-text">កំពង់ស្ពឺ</li>
          <li className="khmer-text">កំពង់ធំ</li>
          <li className="khmer-text">កំពត</li>
          <li className="khmer-text">កណ្តាល</li>
          <li className="khmer-text">កោះកុង</li>
          <li className="khmer-text">ក្រចេះ</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h2>Student Identifiers</h2>
        <p className="khmer-text">សិស្សទី១</p>
        <p className="khmer-text">សិស្សទី២</p>
        <p className="khmer-text">សិស្សទី៣</p>
        <p className="khmer-text">សិស្សទី៤</p>
        <p className="khmer-text">សិស្សទី៥</p>
      </div>

      <div className={styles.section}>
        <h2>Subject Names</h2>
        <p className="khmer-text">អំណាន</p>
        <p className="khmer-text">សរសេរ</p>
        <p className="khmer-text">គណិតវិទ្យា</p>
      </div>
    </div>
  );
}