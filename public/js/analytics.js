// DOM Elements for Analytics Page
// Donut DOM
const donutTotalText = document.getElementById('donut-total-text');
const segNew = document.getElementById('donut-seg-new');
const segReviewing = document.getElementById('donut-seg-reviewing');
const segMastered = document.getElementById('donut-seg-mastered');
const lblCountNew = document.getElementById('lbl-count-new');
const lblCountReviewing = document.getElementById('lbl-count-reviewing');
const lblCountMastered = document.getElementById('lbl-count-mastered');

// Bar Chart DOM
const barsWrapper = document.getElementById('bars-wrapper');
const yAxisMax = document.querySelector('.bar-y-axis span:first-child');
const yAxisMid = document.querySelector('.bar-y-axis span:nth-child(2)');

// Heatmap DOM
const heatmapGridWeeks = document.getElementById('heatmap-grid-weeks');
const heatmapMonthsRow = document.getElementById('heatmap-months-row');
const heatmapSubtitle = document.getElementById('heatmap-subtitle');

// Callback triggered by auth-helper.js upon successful session verification
window.onAuthSuccess = function(user) {
    loadAnalytics();
};

// ==========================================
// ANALYTICS DATA LOADING
// ==========================================

async function loadAnalytics() {
    try {
        const response = await fetch('/api/analytics');
        if (handleApiError(response)) return;
        const data = await response.json();
        
        // 1. Render Donut Chart
        renderDonut(data.summary);
        
        // 2. Render Bar Chart
        renderBarChart(data.last7Days);
        
        // 3. Render Heatmap
        renderHeatmap(data.heatmap);
        
    } catch (err) {
        console.error("Lỗi tải phân tích học tập:", err);
    }
}

function renderDonut(summary) {
    const total = summary.totalCards;
    donutTotalText.textContent = total;
    
    lblCountNew.textContent = summary.newCount;
    lblCountReviewing.textContent = summary.reviewingCount;
    lblCountMastered.textContent = summary.masteredCount;
    
    // Percentage calculations for SVG
    const newPercent = total > 0 ? (summary.newCount / total) * 100 : 0;
    const reviewingPercent = total > 0 ? (summary.reviewingCount / total) * 100 : 0;
    const masteredPercent = total > 0 ? (summary.masteredCount / total) * 100 : 0;
    
    // Set Dasharrays (segment length vs remaining empty circumference)
    segNew.setAttribute('stroke-dasharray', `${newPercent} ${100 - newPercent}`);
    segNew.setAttribute('stroke-dashoffset', '25'); // start at top (12 o'clock)
    
    segReviewing.setAttribute('stroke-dasharray', `${reviewingPercent} ${100 - reviewingPercent}`);
    segReviewing.setAttribute('stroke-dashoffset', `${25 - newPercent}`);
    
    segMastered.setAttribute('stroke-dasharray', `${masteredPercent} ${100 - masteredPercent}`);
    segMastered.setAttribute('stroke-dashoffset', `${25 - newPercent - reviewingPercent}`);
}

function renderBarChart(last7Days) {
    // Find maximum count for scaling
    const maxCount = Math.max(...last7Days.map(d => d.count), 1);
    
    // Set Y Axis labels
    yAxisMax.textContent = maxCount;
    yAxisMid.textContent = Math.round(maxCount / 2);
    
    barsWrapper.innerHTML = '';
    last7Days.forEach(day => {
        const barCol = document.createElement('div');
        barCol.className = 'bar-column';
        
        // Scale height percentage (reserve 5% minimum so bar is visible even if 0 count)
        const heightPercent = Math.max(5, (day.count / maxCount) * 100);
        
        barCol.innerHTML = `
            <div class="bar" style="height: ${heightPercent}%;" data-count="${day.count} thẻ"></div>
            <span class="bar-label">${day.date}</span>
        `;
        barsWrapper.appendChild(barCol);
    });
}

function renderHeatmap(heatmap) {
    heatmapGridWeeks.innerHTML = '';
    heatmapMonthsRow.innerHTML = '';
    
    // Calculate active days (where count > 0)
    let activeDays = 0;
    const dataMap = {};
    heatmap.forEach(item => {
        dataMap[item.date] = item;
        if (item.count > 0) {
            activeDays++;
        }
    });
    
    if (heatmapSubtitle) {
        heatmapSubtitle.textContent = `Bạn đã làm được ${activeDays} trong 365 ngày`;
    }
    
    // Start date for the 53-week grid (Monday containing Jan 1, 2026 is Dec 29, 2025)
    const startDate = new Date("2025-12-29");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let prevMonthIndex = -1;
    
    // Generate 53 columns (weeks)
    for (let w = 0; w < 53; w++) {
        const col = document.createElement('div');
        col.className = 'heatmap-column';
        
        // Generate 7 cells for each week (Monday to Sunday)
        for (let d = 0; d < 7; d++) {
            const cellDate = new Date(startDate.getTime() + (w * 7 + d) * 24 * 60 * 60 * 1000);
            
            const year = cellDate.getFullYear();
            const monthVal = cellDate.getMonth();
            const monthStr = String(monthVal + 1).padStart(2, '0');
            const dayStr = String(cellDate.getDate()).padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;
            
            const cell = document.createElement('div');
            
            if (year !== 2026) {
                cell.className = 'heatmap-cell placeholder';
            } else {
                const cellInfo = dataMap[dateKey];
                const count = cellInfo ? cellInfo.count : 0;
                const level = cellInfo ? cellInfo.level : 0;
                
                cell.className = `heatmap-cell lvl-${level}`;
                
                const formattedDate = `${dayStr}/${monthStr}/${year}`;
                let activityText = "Chưa rèn luyện";
                if (count > 0) {
                    activityText = `Đã ôn tập ${count} thẻ`;
                }
                cell.setAttribute('data-tooltip', `${formattedDate}: ${activityText}`);
            }
            col.appendChild(cell);
        }
        heatmapGridWeeks.appendChild(col);
        
        // Align Month labels dynamically: check the Wednesday of each week
        const midWeekDay = new Date(startDate.getTime() + (w * 7 + 3) * 24 * 60 * 60 * 1000);
        const monthIndex = midWeekDay.getMonth();
        
        const monthLabel = document.createElement('span');
        monthLabel.className = 'month-label';
        
        if (w === 0 || monthIndex !== prevMonthIndex) {
            monthLabel.textContent = monthNames[monthIndex];
            prevMonthIndex = monthIndex;
        } else {
            monthLabel.textContent = '';
        }
        heatmapMonthsRow.appendChild(monthLabel);
    }
}

