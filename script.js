document.getElementById('generate').addEventListener('click', async () => {
  const planFile = document.getElementById('plan').files[0];
  const scheduleFile = document.getElementById('schedule').files[0];
  const coverUrl = document.getElementById('cover-url').value;
  const targetDateInput = document.getElementById('target-date').value;

  if (!planFile || !scheduleFile || !coverUrl || !targetDateInput) {
    alert('Please provide all required inputs.');
    return;
  }

  const targetDate = new Date(targetDateInput);
  const planData = await parseCSV(planFile);
  const scheduleData = await parseCSV(scheduleFile);

  const dday = calculateDday(targetDate);
  const htmlContent = generateHTML(planData, scheduleData, coverUrl, dday);

  const newWindow = window.open('', '_blank');
  newWindow.document.write(htmlContent);
  newWindow.document.close();
});

// Parse CSV files
async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = reader.result.split('\n').map(row => row.split(','));
      resolve(rows);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}


// Calculate D-day values
function calculateDday(targetDate) {
  const today = new Date();
  const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  return Array.from({ length: 7 }, (_, i) => daysLeft - i);
}

// Generate HTML content
function generateHTML(planData, scheduleData, coverUrl, dday) {
  function habitlist(title, sup, description, habits) {
    return `
      <h2>${title}<sup>${sup}</sup></h2>
      <h4 class="editable-description" onclick="editDescription(this)">${description}</h4>
      <ul style="list-style-type:circle;font-size:14px;">
        ${habits.map(habit => `<li>${habit}</li>`).join('')}
      </ul>`;
  }



  function generateTimetable(title, sup, startHour, endHour, interval) {
    let timetableHtml = `<h2>${title}<sup>${sup}</sup></h2><div class="timetable"><div class="time-slots">`;
    for (let hour = startHour; hour <= endHour; hour += interval) {
      timetableHtml += `
        <div class="time-slot">
          <div class="time">${hour}:00</div>
          <div class="activity"></div>
        </div>`;
    }
    timetableHtml += '</div></div>';
    return timetableHtml;
  }

  const schedule = scheduleData.reduce((acc, row, idx) => {
    if (idx === 0) return acc; // Skip header
    row.forEach((task, dayIdx) => {
      if (task.trim()) {
        const day = scheduleData[0][dayIdx];
        acc[day] = acc[day] || [];
        acc[day].push(task.trim());
      }
    });
    return acc;
  }, {});

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;700&display=swap">
      <title>Generated Schedule</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 297mm;
          height: 210mm;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(2, 1fr);
          font-family: 'Josefin Sans', sans-serif;
        }
        .part {
          box-sizing: border-box;
          display: block;
          justify-content: center;
          align-items: center;
          font-size: 15px;
          padding: 20px;
        }
        .part img {
          width: 100%;
          height: auto;
          display: block;
        }
        .rotated {
          transform: rotate(180deg);
        }
      </style>
    </head>
    <body>
      <div class="part rotated">${habitlist("Saturday", `D-${dday[5]}`, "Description here", schedule['Tuesday'])}</div>
      <div class="part rotated">${habitlist("Friday", `D-${dday[4]}`, "Description here", schedule['Tuesday'])}</div>
      <div class="part rotated">${habitlist("Thursday", `D-${dday[3]}`, "Description here", schedule['Thursday'])}</div>
      <div class="part rotated">${habitlist("Wednesday", `D-${dday[2]}`, "Description here", schedule['Wednesday'])}</div>




      <div class="part">${habitlist("Sunday", `D-${dday[6]}`, "Description here", schedule['Tuesday'])}</div>
      <div class="part"><img src="${coverUrl}" alt="Cover Image"></div>
      <div class="part">${habitlist("Monday", `D-${dday[0]}`, "Description here", schedule['Monday'])}</div>
      <div class="part">${habitlist("Tuesday", `D-${dday[1]}`, "Description here", schedule['Tuesday'])}</div>
      <script>
        function editDescription(element) {
          const newDescription = prompt("Edit description:", element.innerText);
          if (newDescription !== null && newDescription.trim() !== "") {
            element.innerText = newDescription;
          }
        }
    </script>
    </body>
    </html>`;
}
