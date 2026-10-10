# 🛡️ CyberSecurity Dashboard 

An interactive, real-time threat intelligence dashboard designed to monitor, filter, and analyze global cybersecurity incidents.

## 🌐 Live Demo
Check out the live dashboard here: [**View Live Dashboard**](https://sulimanal1.github.io/Cyber-Security-Dashboard/)

## 📝 Project Overview
This project is a high-performance web application that aggregates live security feeds from top-tier intelligence sources (like CISA, BleepingComputer, and SANS ISC). It transforms raw XML/RSS data into actionable insights, featuring automated incident analysis and professional security briefings.

## 🚀 Core Features
* **Live Intel Feed Integration:** Automatically fetches and parses real-time data from CISA (KEV), The Hacker News, Abuse.ch, and more.
* **Smart Incident Filtering:** Custom logic that filters out general industry "noise" to focus exclusively on actual breaches, exploits, and vulnerabilities.
* **Automated Threat Analysis:**
    * **Attacker Identification:** Automatically detects threat actors (e.g., LockBit, APT29, Lazarus).
    * **Financial Impact Detection:** Uses Regex to extract estimated costs and losses from report descriptions.
    * **Dynamic Remediation:** Generates immediate mitigation strategies based on the attack vector (Ransomware, DDoS, Phishing, etc.).
* **Data Visualization:**
    * **Incident Velocity Chart:** A timeline view of attack frequency.
    * **Threat Vector Distribution:** A statistical breakdown of attack methods.
* **Daily Intelligence Briefing:** A professional, TLP:AMBER formatted report view for executive summaries.

## 🛠️ Tech Stack
* **Frontend:** [React.js](https://reactjs.org/) (Hooks & State Management).
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom "Cyberpunk" dark theme.
* **Data Handling:** DOMParser for XML/RSS parsing and Regex for data extraction.
* **API Management:** Integrated via `corsproxy.io` for seamless live data fetching.

## ⚙️ How to Run
Since this is a standalone React-powered HTML application, no complex installation is required:
1.  Clone the repository:
    ```bash
    git clone [https://github.com/sulimanal1/Cyber-Security-Dashboard.git](https://github.com/sulimanal1/Cyber-Security-Dashboard.git)
    ```
2.  Open the `index.html` file in any modern web browser.

## 🎓 Academic Context
Developed as part of the **Security and Networks** specialization at **Zayed University**, focusing on automated security monitoring and threat visualization.

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
Developed by **Sulaiman Alhabsi** 🚀
