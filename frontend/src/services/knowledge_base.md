# Trash2Cash.lk - System Knowledge Base

## 1. Core Concept and Goal

### 1.1. The Problem We Solve
[cite_start]In Sri Lanka, the informal waste collection industry lacks transparency, structure, and trust[cite: 17, 1458]. [cite_start]Diesel trucks operate without schedules, use unregulated pricing, and provide no accountability, leaving customers unsure of the real value of their recyclables[cite: 19, 20, 526]. [cite_start]This system leads to noise and air pollution, unsafe handling of hazardous materials, and inefficient recycling processes[cite: 19, 47, 49, 537].

### 1.2. Our Solution: Trash2Cash.lk
[cite_start]Trash2Cash.lk is a **web-based digital platform** designed to formalize and modernize Sri Lanka's recyclable waste management[cite: 23, 529]. [cite_start]It connects households and businesses (**Customers**) with verified **Pickup Agents** and certified **Recyclers** through a structured, transparent, and efficient ecosystem[cite: 24, 529].

### 1.3. Our Aim
[cite_start]Our goal is to create a "Smart Waste Collection Network" for Sri Lanka[cite: 71, 569]. [cite_start]This platform allows users to schedule pickups, track their contributions, and receive fair rewards, while ensuring that pickup agents operate efficiently and recyclers receive clean, sorted materials[cite: 71, 72, 570].

---

## 2. User Roles & Stakeholders

[cite_start]The platform is designed for five primary stakeholders[cite: 619]:

1.  [cite_start]**Customers (Households & Businesses):** The generators of recyclable waste[cite: 625]. [cite_start]They use the system to schedule pickups, monitor their smart bins, track earnings, and ensure their waste is handled responsibly[cite: 626].
2.  [cite_start]**Pickup Agents (Drivers/Collectors):** The individuals who physically collect the waste from customers[cite: 628]. [cite_start]The platform provides them with optimized routes, clear schedules, and a transparent way to track their earnings and commissions[cite: 629].
3.  [cite_start]**Pickup Partners (Licensed Collectors):** These are the companies or organizations that employ and manage the pickup agents[cite: 631]. [cite_start]They use the platform as a centralized tool to manage their fleet, track collection volumes, handle complaints, and oversee revenue[cite: 632, 633].
4.  [cite_start]**Recyclers:** The end-buyers of the collected materials[cite: 634]. [cite_start]They use the platform to find and purchase a consistent, reliable supply of sorted, quality-certified recyclable waste[cite: 634].
5.  [cite_start]**Administrators:** The operators of the Trash2Cash.lk platform[cite: 620]. [cite_start]They are responsible for managing user accounts, setting waste prices, monitoring system activity, and ensuring the smooth operation of the entire ecosystem[cite: 621, 623].

---

## 3. Core System Modules & Features

[cite_start]The system is built around five major modules[cite: 582]:

### 3.1. [cite_start]Bin Management [cite: 104, 583]
* [cite_start]**Smart Bins:** Registered users can be assigned an IoT-enabled smart bin[cite: 106, 640]. [cite_start]These bins are equipped with **ultrasonic sensors** to monitor waste levels in real-time[cite: 107, 495].
* [cite_start]**Automated Notifications:** When a smart bin reaches its optimal capacity, it automatically sends a notification to both the user and the nearest available pickup agent[cite: 108, 495]. [cite_start]This optimizes pickup routes and prevents overflow[cite: 109, 495].
* [cite_start]**Manual Scheduling:** Users without smart bins can still schedule pickups manually through the platform[cite: 112].
* [cite_start]**Live Map View:** Pickup agents can view a live map showing the locations of full or nearly-full bins in their assigned area[cite: 117].

### 3.2. [cite_start]Finance Management [cite: 119, 586]
* [cite_start]**Transparent Payments:** Customer payments are calculated automatically based on the **weight and type** of waste collected, using current market rates set by the admin[cite: 122, 123, 1466].
* [cite_start]**Digital Transactions:** Payments are processed through integrated **digital wallets or direct bank transfers** (using the Stripe API)[cite: 125, 496]. [cite_start]Customers receive transaction confirmations and can view a detailed history[cite: 124, 125, 1467].
* [cite_start]**Automated Commissions:** The system automatically calculates and deposits commissions for pickup agents for each successful collection[cite: 126, 495].
* [cite_start]**Financial Reporting:** The platform generates comprehensive financial reports, including transaction summaries, revenue reports, and agent commission statements for administrators and partners[cite: 132, 1468].

### 3.3. [cite_start]Pickup Agent & Waste Management (For Partners) [cite: 137, 587]
* [cite_start]**Agent Management:** Pickup Partners can register new agents, assign them unique IDs, and define daily collection routes[cite: 140, 141].
* [cite_start]**Performance Tracking:** The system monitors key agent metrics like the number of pickups, average weight collected, customer satisfaction ratings, and on-time performance[cite: 142].
* [cite_start]**Complaint Resolution:** Customer complaints about agents are routed directly to the responsible Pickup Partner for review and resolution[cite: 144, 145].

### 3.4. [cite_start]Waste Management (For Recyclers) [cite: 149, 588]
* [cite_start]**Inventory Dashboard:** Recyclers can view a real-time inventory of available recyclable materials from various pickup partners, with details on waste type, quantity, quality grade, and location[cite: 152, 154].
* [cite_start]**Structured Ordering:** Recyclers can place bulk orders for specific materials directly through the platform[cite: 151]. [cite_start]The pickup partner receives the request for approval, ensuring a reliable and efficient supply chain[cite: 159, 161].

### 3.5. [cite_start]HR & System Management (For Admins) [cite: 163, 589]
* [cite_start]**User & Role Management:** Admins have centralized control to create, modify, and manage all user accounts and roles (customers, agents, partners, recyclers)[cite: 164].
* [cite_start]**Pricing Control:** Admins can set and update the market rates for different categories of waste based on current commodity prices[cite: 166, 671].
* [cite_start]**System Configuration:** Admins can customize platform-wide settings, including collection policies and quality standards[cite: 167].

---

## [cite_start]4. Technical Specifications [cite: 185]

* [cite_start]**Architecture:** MERN Stack [cite: 392, 497]
    * [cite_start]**Frontend:** **React.js** for a responsive, dynamic, and user-friendly interface[cite: 187, 402, 403].
    * [cite_start]**Backend:** **Node.js** and **Express.js** to build a robust RESTful API that handles all business logic[cite: 189, 408, 411].
    * [cite_start]**Database:** **MongoDB** (NoSQL) for flexible storage of user profiles, pickup records, IoT data, and more[cite: 198, 405].
* [cite_start]**Authentication:** **JWT (JSON Web Tokens)** are used for secure session management[cite: 195, 497].
* [cite_start]**IoT Integration:** [cite: 200, 379]
    * [cite_start]**Microcontroller:** **ESP32** modules are installed in smart bins for Wi-Fi enabled data transmission[cite: 201, 387, 495].
    * [cite_start]**Sensors:** **Ultrasonic sensors** for fill-level detection[cite: 202, 495].
* **API Integrations:**
    * [cite_start]**Payment Gateway:** **Stripe API** for secure digital payment processing[cite: 205, 374, 496].
    * [cite_start]**Maps & Routing:** **Google Maps API** for route optimization and live map displays[cite: 206, 496].
* [cite_start]**Development Methodology:** **Agile Software Engineering**[cite: 302, 498]. [cite_start]The project was developed in iterative sprints to ensure flexibility, collaboration, and continuous feedback[cite: 304, 305, 609].