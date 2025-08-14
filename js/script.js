
 // Массив для хранения задач
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        // Элементы DOM
        const nowTasksEl = document.getElementById('nowTasks');
        const plansTasksEl = document.getElementById('plansTasks');
        const addBtn = document.getElementById('addBtn');
        const taskModal = document.getElementById('taskModal');
        const closeModal = document.getElementById('closeModal');
        const submitBtn = document.getElementById('submitTask');
        const typeOptions = document.querySelectorAll('.type-option');
        const taskTimeGroup = document.getElementById('taskTimeGroup');
        const eventTimeGroup = document.getElementById('eventTimeGroup');
        
        // Текущий выбранный тип (задача/мероприятие)
        let currentType = 'task';
        
        // Инициализация при загрузке
        window.onload = function() {
            updateTaskLists();
            checkTasksTimers();
            setInterval(checkTasksTimers, 60000); // Проверка каждую минуту
        };
        
        // Открытие модального окна
        addBtn.addEventListener('click', () => {
            taskModal.style.display = 'flex';
            document.getElementById('taskTitle').focus();
        });
        
        // Закрытие модального окна
        closeModal.addEventListener('click', () => {
            taskModal.style.display = 'none';
        });
        
        // Клик вне модального окна
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) {
                taskModal.style.display = 'none';
            }
        });
        
        // Переключение между типами (задача/мероприятие)
        typeOptions.forEach(option => {
            option.addEventListener('click', () => {
                typeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                currentType = option.dataset.type;
                
                if (currentType === 'task') {
                    taskTimeGroup.style.display = 'block';
                    eventTimeGroup.style.display = 'none';
                } else {
                    taskTimeGroup.style.display = 'none';
                    eventTimeGroup.style.display = 'block';
                }
            });
        });
        
        // Добавление новой задачи/мероприятия
        submitBtn.addEventListener('click', () => {
            const title = document.getElementById('taskTitle').value;
            const description = document.getElementById('taskDesc').value;
            
            if (!title) {
                alert('Введите название!');
                return;
            }
            
            let startTime, endTime;
            
            if (currentType === 'task') {
                startTime = document.getElementById('taskTime').value;
                endTime = null;
                
                if (!startTime) {
                    alert('Укажите время для задачи!');
                    return;
                }
            } else {
                startTime = document.getElementById('eventStart').value;
                endTime = document.getElementById('eventEnd').value;
                
                if (!startTime || !endTime) {
                    alert('Укажите время начала и окончания мероприятия!');
                    return;
                }
                
                if (new Date(startTime) >= new Date(endTime)) {
                    alert('Время окончания должно быть позже времени начала!');
                    return;
                }
            }
            
            const task = {
                id: Date.now(),
                title: title,
                description: description,
                type: currentType,
                startTime: startTime,
                endTime: endTime,
                column: shouldBeNow(new Date(startTime)) ? 'now' : 'plans',
                completed: false
            };
            
            tasks.push(task);
            saveTasks();
            updateTaskLists();
            taskModal.style.display = 'none';
            
            // Очистка формы
            document.getElementById('taskTitle').value = '';
            document.getElementById('taskDesc').value = '';
            document.getElementById('taskTime').value = '';
            document.getElementById('eventStart').value = '';
            document.getElementById('eventEnd').value = '';
        });
        
        // Проверка, должна ли задача быть в "На сейчас"
        function shouldBeNow(taskTime) {
            const now = new Date();
            return taskTime - now <= 3600000; // 1 час в миллисекундах
        }
        
        // Обновление списков задач
        function updateTaskLists() {
            nowTasksEl.innerHTML = '';
            plansTasksEl.innerHTML = '';
            
            // Сортируем задачи по времени
            tasks.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            
            tasks.forEach(task => {
                if (!task.completed) {
                    const taskElement = createTaskElement(task);
                    
                    if (task.column === 'now') {
                        nowTasksEl.appendChild(taskElement);
                    } else {
                        plansTasksEl.appendChild(taskElement);
                    }
                }
            });
        }
        
        // Создание элемента задачи
        function createTaskElement(task) {
            const taskElement = document.createElement('div');
            taskElement.className = `task ${task.column === 'now' ? 'urgent' : 'planned'}`;
            taskElement.dataset.id = task.id;
            
            const titleElement = document.createElement('div');
            titleElement.className = 'title';
            
            const typeBadge = document.createElement('span');
            typeBadge.className = 'type-badge';
            typeBadge.textContent = task.type === 'task' ? 'Задача' : 'Мероприятие';
            titleElement.appendChild(typeBadge);
            
            titleElement.appendChild(document.createTextNode(task.title));
            
            if (task.description) {
                const descElement = document.createElement('div');
                descElement.className = 'description';
                descElement.textContent = task.description;
                taskElement.appendChild(descElement);
            }
            
            const timeElement = document.createElement('div');
            timeElement.className = 'time';
            
            const timeIcon = document.createElement('span');
            timeIcon.className = 'material-icons';
            timeIcon.textContent = 'access_time';
            timeElement.appendChild(timeIcon);
            
            if (task.type === 'task') {
                const taskTime = new Date(task.startTime);
                timeElement.appendChild(document.createTextNode(`Выполнить в: ${formatDateTime(taskTime)}`));
            } else {
                const startTime = new Date(task.startTime);
                const endTime = new Date(task.endTime);
                timeElement.appendChild(document.createTextNode(
                    `${formatDateTime(startTime)} - ${formatTime(endTime)}`
                ));
            }
            
            const actionsElement = document.createElement('div');
            actionsElement.className = 'actions';
            
            const completeBtn = createActionButton('done', 'Отметить выполненным', () => completeTask(task.id));
            const moveBtn = createActionButton(
                task.column === 'now' ? 'schedule' : 'priority_high',
                task.column === 'now' ? 'Перенести в планы' : 'Сделать срочным',
                () => moveTask(task.id)
            );
            const editBtn = createActionButton('edit', 'Редактировать', () => editTask(task.id));
            const deleteBtn = createActionButton('delete', 'Удалить', () => deleteTask(task.id));
            
            actionsElement.appendChild(completeBtn);
            actionsElement.appendChild(moveBtn);
            actionsElement.appendChild(editBtn);
            actionsElement.appendChild(deleteBtn);
            
            taskElement.appendChild(titleElement);
            taskElement.appendChild(timeElement);
            taskElement.appendChild(actionsElement);
            
            return taskElement;
        }
        
        // Создание кнопки действия
        function createActionButton(icon, title, onClick) {
            const btn = document.createElement('button');
            btn.title = title;
            
            const iconEl = document.createElement('span');
            iconEl.className = 'material-icons';
            iconEl.textContent = icon;
            btn.appendChild(iconEl);
            
            btn.addEventListener('click', onClick);
            return btn;
        }
        
        // Форматирование даты и времени
        function formatDateTime(date) {
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Форматирование только времени
        function formatTime(date) {
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Проверка таймеров задач
        function checkTasksTimers() {
            const now = new Date();
            let needUpdate = false;
            
            tasks.forEach(task => {
                if (task.startTime && !task.completed && task.column === 'plans') {
                    const taskTime = new Date(task.startTime);
                    if (shouldBeNow(taskTime)) {
                        task.column = 'now';
                        needUpdate = true;
                    }
                }
            });
            
            if (needUpdate) {
                saveTasks();
                updateTaskLists();
            }
        }
        
        // Функции для работы с задачами
        function completeTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = true;
                saveTasks();
                updateTaskLists();
            }
        }
        
        function moveTask(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.column = task.column === 'now' ? 'plans' : 'now';
                saveTasks();
                updateTaskLists();
            }
        }
        
        function editTask(id) {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            
            // Заполняем форму данными задачи
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDesc').value = task.description || '';
            
            // Устанавливаем правильный тип
            typeOptions.forEach(opt => opt.classList.remove('active'));
            const typeOption = document.querySelector(`.type-option[data-type="${task.type}"]`);
            typeOption.classList.add('active');
            currentType = task.type;
            
            if (task.type === 'task') {
                taskTimeGroup.style.display = 'block';
                eventTimeGroup.style.display = 'none';
                document.getElementById('taskTime').value = task.startTime;
            } else {
                taskTimeGroup.style.display = 'none';
                eventTimeGroup.style.display = 'block';
                document.getElementById('eventStart').value = task.startTime;
                document.getElementById('eventEnd').value = task.endTime;
            }
            
            // Показываем модальное окно
            taskModal.style.display = 'flex';
            
            // Удаляем старую задачу при сохранении
            submitBtn.onclick = function() {
                const title = document.getElementById('taskTitle').value;
                const description = document.getElementById('taskDesc').value;
                
                if (!title) {
                    alert('Введите название!');
                    return;
                }
                
                let startTime, endTime;
                
                if (currentType === 'task') {
                    startTime = document.getElementById('taskTime').value;
                    endTime = null;
                    
                    if (!startTime) {
                        alert('Укажите время для задачи!');
                        return;
                    }
                } else {
                    startTime = document.getElementById('eventStart').value;
                    endTime = document.getElementById('eventEnd').value;
                    
                    if (!startTime || !endTime) {
                        alert('Укажите время начала и окончания мероприятия!');
                        return;
                    }
                    
                    if (new Date(startTime) >= new Date(endTime)) {
                        alert('Время окончания должно быть позже времени начала!');
                        return;
                    }
                }
                
                // Обновляем задачу
                task.title = title;
                task.description = description;
                task.type = currentType;
                task.startTime = startTime;
                task.endTime = endTime;
                task.column = shouldBeNow(new Date(startTime)) ? 'now' : 'plans';
                
                saveTasks();
                updateTaskLists();
                taskModal.style.display = 'none';
                
                // Очистка формы и восстановление стандартного обработчика
                document.getElementById('taskTitle').value = '';
                document.getElementById('taskDesc').value = '';
                document.getElementById('taskTime').value = '';
                document.getElementById('eventStart').value = '';
                document.getElementById('eventEnd').value = '';
                
                submitBtn.onclick = submitTaskHandler;
            };
        }
        
        function deleteTask(id) {
            if (confirm('Удалить эту запись?')) {
                tasks = tasks.filter(t => t.id !== id);
                saveTasks();
                updateTaskLists();
            }
        }
        
        // Сохранение задач в localStorage
        function saveTasks() {
            localStorage.setItem('tasks', JSON.stringify(tasks));

        }