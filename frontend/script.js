const taskForm = document.getElementById('taskForm');
const taskList = document.getElementById('taskList');

taskForm.onsubmit = async (e) => {
  e.preventDefault();
  const name = document.getElementById('taskInput').value;
  const date = document.getElementById('dateInput').value;
  const time = document.getElementById('timeInput').value;

  await fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, date, time, completed: false })
  });

  taskForm.reset();
  loadTasks();
};

// Request notification permission on page load
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission();
}

async function loadTasks() {
  const res = await fetch('http://localhost:3000/tasks');
  const tasks = await res.json();

  taskList.innerHTML = '';
  const now = new Date();

  tasks.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  tasks.forEach(task => {
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    const li = document.createElement('li');
    li.className = 'task-item';

    const countdownSpan = document.createElement('span');
    li.textContent = `${task.name} - ${task.date} ${task.time} `;

    if (task.completed) {
      li.style.textDecoration = 'line-through';
      li.style.opacity = '0.6';
    }

    if (!task.completed && taskDateTime > now) {
      const updateCountdown = () => {
        const remaining = taskDateTime - new Date();
        if (remaining <= 0) {
          countdownSpan.textContent = ' ⏰ Due now!';
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          countdownSpan.textContent = ` (${minutes}m ${seconds}s left)`;
        }
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
    }

    li.appendChild(countdownSpan);

    if (!task.completed) {
      const reminderTime = taskDateTime.getTime() - 60 * 1000;
      const timeUntilReminder = reminderTime - Date.now();

      if (timeUntilReminder > 0) {
        setTimeout(() => {
          if (Notification.permission === 'granted') {
            new Notification(`⏰ Reminder: "${task.name}" is due in 1 minute!`);
          }
        }, timeUntilReminder);
      }
    }

    const doneBtn = document.createElement('button');
    doneBtn.textContent = '✔️';
    doneBtn.onclick = async () => {
      task.completed = true;
      await fetch(`http://localhost:3000/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      loadTasks();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '❌';
    deleteBtn.onclick = async () => {
      await fetch(`http://localhost:3000/tasks/${task.id}`, { method: 'DELETE' });
      loadTasks();
    };

    li.appendChild(doneBtn);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
}

loadTasks();
