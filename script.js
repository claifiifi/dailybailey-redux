document.getElementById('basis').addEventListener('change', (event) => {
  const customDateLabel = document.getElementById('custom-date-label');
  const customDateInput = document.getElementById('custom-date');
  if (event.target.value === 'custom') {
    customDateLabel.style.display = 'block';
    customDateInput.style.display = 'block';
  } else {
    customDateLabel.style.display = 'none';
    customDateInput.style.display = 'none';
  }
});

document.getElementById('generate').addEventListener('click', async () => {
  const planFile = document.getElementById('plan').files[0];
  const coverUrl = document.getElementById('cover-url').value;
  const targetDateInput = document.getElementById('target-date').value;
  const basis = document.getElementById('basis').value;
  const customDateInput = document.getElementById('custom-date').value;
  const descriptions = {
    saturday: document.getElementById('description-saturday').value,
    sunday: document.getElementById('description-sunday').value,
    monday: document.getElementById('description-monday').value,
    tuesday: document.getElementById('description-tuesday').value,
    wednesday: document.getElementById('description-wednesday').value,
    thursday: document.getElementById('description-thursday').value,
    friday: document.getElementById('description-friday').value,
  };

  if (!planFile || !coverUrl || !targetDateInput || (basis === 'custom' && !customDateInput) || Object.values(descriptions).some(desc => !desc)) {
    alert('Please provide all required inputs.');
    return;
  }

  const targetDate = new Date(targetDateInput);
  const basisDate = basis === 'custom' ? new Date(customDateInput) : new Date();
  const planData = await parseCSV(planFile);

  if (!planData || planData.length === 0) {
    alert('The CSV file is empty or invalid.');
    return;
  }

  const dday = calculateDday(targetDate, basisDate);
  const dateRange = calculateDateRange(basisDate);
  const htmlContent = generateHTML(planData, coverUrl, dday, descriptions, dateRange);

  // Debugging: Display the parsed schedule in the console
  console.log('Parsed Schedule:', planData);

  const newWindow = window.open('', '_blank');
  newWindow.document.write(htmlContent);
  newWindow.document.close();
});

// Parse CSV files
async function parseCSV(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = reader.result.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      resolve(rows);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Calculate D-day values
function calculateDday(targetDate, basisDate) {
  const daysLeft = Math.ceil((targetDate - basisDate) / (1000 * 60 * 60 * 24));

  return Array.from({ length: 7 }, (_, i) => daysLeft - i);
}

// Calculate date range
function calculateDateRange(basisDate) {
  const endDate = new Date(basisDate);
  endDate.setDate(basisDate.getDate() + 6);

  const options = { month: 'long', day: 'numeric' };
  const startDateStr = basisDate.toLocaleDateString('en-US', options);
  const endDateStr = endDate.toLocaleDateString('en-US', options);

  return `${startDateStr} - ${endDateStr}`;
}

// Generate HTML content
function generateHTML(planData, coverUrl, dday, descriptions, dateRange) {
  function habitlist(title, sup, description, habits) {
    return `
      <h2>${title}<sup>${sup}</sup></h2>
      <h4 class="editable-description" onclick="editDescription(this)">${description}</h4>
      <ul style="list-style-type:circle;font-size:14px;">
        ${habits.map(habit => `<li>${habit}</li>`).join('')}
      </ul>`;
  }

  const schedule = planData.reduce((acc, row, idx) => {
    if (idx === 0) return acc; // Skip header
    row.forEach((task, dayIdx) => {
      if (task.trim()) {
        const day = planData[0][dayIdx].trim();
        acc[day] = acc[day] || [];
        acc[day].push(task.trim());
      }
    });
    return acc;
  }, {});

  // Debugging: Display the schedule object in the console
  console.log('Generated Schedule:', schedule);

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
      
      <div class="part rotated">${habitlist("Saturday", `D-${dday[5]}`, descriptions.saturday, schedule['Saturday'])}</div>
      <div class="part rotated">${habitlist("Friday", `D-${dday[4]}`, descriptions.friday, schedule['Friday'])}</div>
      <div class="part rotated">${habitlist("Thursday", `D-${dday[3]}`, descriptions.thursday, schedule['Thursday'])}</div>
      <div class="part rotated">${habitlist("Wednesday", `D-${dday[2]}`, descriptions.wednesday, schedule['Wednesday'])}</div>
      <div class="part">${habitlist("Sunday", `D-${dday[6]}`, descriptions.sunday, schedule['Sunday'])}</div>
      <div class="part"><h1>${dateRange}</h1><img src="${coverUrl}" alt="Cover Image"></div>
      <div class="part">${habitlist("Monday", `D-${dday[0]}`, descriptions.monday, schedule['Monday'])}</div>
      <div class="part">${habitlist("Tuesday", `D-${dday[1]}`, descriptions.tuesday, schedule['Tuesday'])}</div>
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
