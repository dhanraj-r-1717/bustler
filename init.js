const chromeDataName = "bustlerData";
let preference = {};
let inputs = [];
let containerClass = "category";
let timer = null;

// Storage monitoring constants and functions
const SYNC_QUOTA_BYTES = 102400; // Chrome sync storage quota

function updateStorageDisplay() {
    chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
        const percentage = (bytesInUse / SYNC_QUOTA_BYTES) * 100;
        const storageText = document.getElementById("storageText");
        const storageUsed = document.getElementById("storageUsed");
        const storageIndicator = document.getElementById("storageIndicator");
        
        if (storageText && storageUsed && storageIndicator) {
            // Format bytes to human readable
            const formatBytes = (bytes) => {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            };
            
            // Update text
            storageText.textContent = `Storage: ${formatBytes(bytesInUse)} / ${formatBytes(SYNC_QUOTA_BYTES)}`;
            
            // Update progress bar
            storageUsed.style.width = `${Math.min(percentage, 100)}%`;
            
            // Update warning classes
            storageIndicator.classList.remove('warning', 'critical');
            if (percentage >= 90) {
                storageIndicator.classList.add('critical');
            } else if (percentage >= 75) {
                storageIndicator.classList.add('warning');
            }
            
            // Update tooltip
            storageIndicator.title = `Chrome Sync Storage Usage: ${percentage.toFixed(1)}% (${formatBytes(bytesInUse)} of ${formatBytes(SYNC_QUOTA_BYTES)})`;
        }
    });
}

function updateData() {
    const bustlerData = {
        inputs,
        preference
    }
    chrome.storage.sync.set({[chromeDataName]: JSON.stringify(bustlerData)}, () => {
        construct();
        updateStorageDisplay(); // Update storage display when data changes
    });
}

function currentTime() {
    if (preference.showDateAndTime) {
        let date = new Date(); 
        let hh = date.getHours();
        let mm = date.getMinutes();
        let ss = date.getSeconds();
        let session = "AM";

        let title = "Good Morning";
        if (hh >= 0 && hh <= 4) {
            title = "Good Night";
        } else if (hh >= 12 && hh <= 16) {
            title = "Good Afternoon";
        } else if (hh >= 17 && hh <= 21) {
            title = "Good Evening";
        }
      
        if(hh == 0){
            hh = 12;
        }
        if(hh > 12){
            hh = hh - 12;
            session = "PM";
         }
      
         hh = (hh < 10) ? "0" + hh : hh;
         mm = (mm < 10) ? "0" + mm : mm;
         ss = (ss < 10) ? "0" + ss : ss;
          
        let weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
        var dt = new Date();
        document.getElementById("clock").innerHTML = `${weekday}, ${dt.getDate()}-${dt.getMonth() + 1}-${dt.getFullYear()} ${hh}:${mm}`; 


        document.getElementById("title").innerHTML = title;
        if (preference.name) {
            const input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("class", "titleTextBox");
            input.setAttribute("value", preference.name);
            input.setAttribute("style", `width: ${Math.round(preference.name.length * 21)}px`)
            input.onkeyup = (e) => {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    const newValue = input.value.trim();

                    if (!newValue) {
                        alert("Category name should not be empty");
                        return;
                    }

                    preference.name = newValue;
                    updateData();
                    currentTime();
                }
            }
            document.getElementById("title").appendChild(input);
        }

        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => { currentTime() }, 1000 * 60);
    }
}

function getDelete(category) {
    const deleteButton = document.createElement("em");
    deleteButton.setAttribute("class", "deleteButton");
    deleteButton.innerHTML = "Delete";
    deleteButton.onclick = () => {
        const index = inputs.findIndex((input) => input.id === category.id);
        inputs.splice(index, 1);
        updateData();
    }
    return deleteButton;
}

function getTitle(category) {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("class", "title");
    input.setAttribute("value", category.title);
    input.onkeyup = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            const newValue = e.target.value.trim();

            if (!newValue) {
                alert("Category name should not be empty");
                return;
            }

            category.title = newValue;
            updateData();
        }
    }
    return input;
}

function getNewTaskInput(category) {
    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("class", "newTaskText");
    input.setAttribute("id", "newTaskText" + category.id);
    input.setAttribute("placeholder", "Enter new task name");

    input.onkeyup = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            const newValue = e.target.value.trim();
            if (!newValue) {
                alert("Task name should not be empty");
                return;
            }
            
            category.tasks.push({
                id: new Date().getTime(),
                name: newValue,
                status: "active"
            });
            updateData();
        }
    }

    return input;
}

function getNewTaskButton(category) {
    const input = document.createElement("input");
    input.setAttribute("type", "button");
    input.setAttribute("class", "newTaskButton");
    input.setAttribute("value", "Add");
    input.onclick = () => {
        const newValue = document.getElementById("newTaskText" + category.id).value.trim();

        if (!newValue) {
            alert("Category name should not be empty");
            return;
        }

        category.tasks.push({
            id: new Date().getTime(),
            name: newValue,
            status: "active"
        });
        updateData();
    }
    return input;
}

function sortAscString(a, b) {
    if (a.name < b.name) {
        return -1;
    }
    if (a.name > b.name) {
        return 1;
    }
    return 0;
}

function sortDescString(a, b) {
    if (a.name > b.name) {
        return -1;
    }
    if (a.name < b.name) {
        return 1;
    }
    return 0;
}

function sort(filteredTasks) {
    if (preference.sorting === "timeAsc") {
        return filteredTasks.sort(function(a, b){return a.id - b.id});
    }
    if (preference.sorting === "timeDesc") {
        return filteredTasks.sort(function(a, b){return b.id - a.id});
    }
    if (preference.sorting === "nameAsc") {
        return filteredTasks.sort(sortAscString);
    }
    if (preference.sorting === "nameDesc") {
        return filteredTasks.sort(sortDescString);
    }
    return filteredTasks;
}

function getFilteredTasks(category, preference, sorting = true) {
    let { tasks, menuPreference } = category;
    
    let filteredTasks = [];
    if (tasks.length) {
        if (preference) {
            menuPreference = preference;
        }

        filteredTasks = tasks || [];
        if (menuPreference !== "all") {
            filteredTasks = filteredTasks.filter((task) => {
                if (task) {
                    if (menuPreference === "active" && task.status === "active") {
                        return true;
                    }
                    if (menuPreference === "completed" && task.status === "completed") {
                        return true;
                    }
                }
                return false;
            });
        }
    }

    if (sorting) {
        return sort(filteredTasks);
    }

    return filteredTasks;
}

function getMenu(category) {
    const { menuPreference } = category;
    const allLen = getFilteredTasks(category, "all", false).length;
    const activeLen = getFilteredTasks(category, "active", false).length;
    const completedLen = getFilteredTasks(category, "completed", false).length;

    const nav = document.createElement("nav");
    const ul = document.createElement("ul");

    let li = document.createElement("li");
    li.setAttribute("class", "item");

    let a = document.createElement("a");
    a.setAttribute("href", "#");
    a.onclick = () => {
        if (menuPreference !== "all") {
            category.menuPreference = "all";
            updateData();
        }
    }
    if (allLen) {
        a.innerHTML = "All<span class='menuTaskCount'>("+allLen+")</span>";
    } else {
        a.innerHTML = "All";
    }
    
    if (menuPreference === "all") {
        a.setAttribute("class", "item active");
    }

    li.appendChild(a);
    ul.appendChild(li);

    li = document.createElement("li");
    li.setAttribute("class", "item");

    a = document.createElement("a");
    a.setAttribute("href", "#");
    a.onclick = () => {
        if (menuPreference !== "active") {
            category.menuPreference = "active";
            updateData();
        }
    }
    if (activeLen) {
        a.innerHTML = "Active<span class='menuTaskCount'>("+activeLen+")</span>";
    } else {
        a.innerHTML = "Active";
    }
    if (menuPreference === "active") {
        a.setAttribute("class", "item active");
    }

    li.appendChild(a);
    ul.appendChild(li);

    li = document.createElement("li");
    li.setAttribute("class", "item");

    a = document.createElement("a");
    a.setAttribute("href", "#");
    a.onclick = () => {
        if (menuPreference !== "completed") {
            category.menuPreference = "completed";
            updateData();
        }
    }
    if (completedLen) {
        a.innerHTML = "Completed<span class='menuTaskCount'>("+completedLen+")</span>";
    } else {
        a.innerHTML = "Completed";
    }
    if (menuPreference === "completed") {
        a.setAttribute("class", "item active");
    }

    li.appendChild(a);
    ul.appendChild(li);
    nav.appendChild(ul);

    return nav;
}

function getDragAndDropIcon(className) {
    const div = document.createElement("div");
    div.setAttribute("class", className);
    div.innerHTML = "::";
    return div;
}

function getTasks(category) {
    const tasks = getFilteredTasks(category);

    const div = document.createElement("div");
    div.setAttribute("class", "menuContent");

    const div1 = document.createElement("div");
    div1.setAttribute("id", "all");

    const ul = document.createElement("ul");
    ul.setAttribute("class", "taskContainer");

    if (tasks.length) {
        tasks.forEach((task) => {
            if (task) {
                const li = document.createElement("li");
                li.setAttribute("class", "task " + task.status);
                li.setAttribute("data-id", task.id);

                if ((!category.menuPreference || category.menuPreference === "all") && preference.sorting === "own") {
                    li.appendChild(getDragAndDropIcon("taskDragAndDrop"));
                }
        
                const checkbox = document.createElement("input");
                checkbox.setAttribute("type", "checkbox");
                if (task.status === "completed") {
                    checkbox.setAttribute("checked", true);
                }
                checkbox.onchange = (event) => {
                    task.status = event.target.checked ? "completed" : "active";
                    updateData();
                }

                if (task.name.includes("https://") || task.name.includes("http://")) {
                    const URLs = task.name.match(/https?:\/\/[\S]*/gi);
                    if (URLs && URLs.length) {
                        const URL = URLs[0];
                        if (URL) {
                            const newTabIcon = document.createElement("div");
                            newTabIcon.setAttribute("class", "newTabIcon");
                            newTabIcon.setAttribute("title", "Go to " + URL);
                            newTabIcon.onclick = () => {
                                window.open(URL);
                            }
                            newTabIcon.innerHTML = "&#8599;";
                            li.appendChild(newTabIcon);
                        }
                    }
                }

                li.setAttribute("title", `Added on ${new Date(task.id)}`);
                li.appendChild(checkbox);
        
                const input = document.createElement("textarea");
                input.innerHTML = task.name;
                input.onkeyup = (e) => {
                    if (e.key === 'Enter' || e.keyCode === 13) {
                        const newValue = event.target.value.trim();
                    
                        if (!newValue) {
                            alert("Task name should not be empty");
                            return;
                        }
                
                        task.name = newValue;
                        updateData();
                    } else {
                        e.target.style.height = "1px";
                        e.target.style.height = (20 + e.target.scrollHeight)+"px";
                    }
                }
                setTimeout(() => {
                    input.style.height = "1px";
                    input.style.height = input.scrollHeight + "px";
                }, 100);
                li.appendChild(input);

                const deleteButton = document.createElement("em");
                deleteButton.setAttribute("class", "taskDeleteButton");
                deleteButton.innerHTML = "x";
                deleteButton.onclick = () => {
                    const index = tasks.findIndex((tsk) => tsk.id === task.id);
                    tasks.splice(index, 1);
                    updateData();
                }
                li.appendChild(deleteButton);

                if (category.menuPreference === "all" && preference.sorting === "own") {
                    li.setAttribute('draggable', true);
                    li.ondragstart= (event) => {
                        event.stopPropagation();
                        event.dataTransfer.setData("id", `${category.id}=${task.id}`);
                        li.classList.add('drag-sort-active');
                    }
                    li.ondrag = (event) => {
                        event.stopPropagation();
                        const x = event.clientX, y = event.clientY;
                        let targetEl = document.elementFromPoint(x, y);
                        if (targetEl && ul === targetEl.parentNode && targetEl.classList.contains("task")) {
                            let swapItem = targetEl === null ? li : targetEl;
                            swapItem = swapItem !== li.nextSibling ? swapItem : swapItem.nextSibling;
                            ul.insertBefore(li, swapItem);
                        }
                    };
    
                    li.ondragend = () => {
                        li.classList.remove('drag-sort-active');
                    };
                    
                }
                ul.appendChild(li);
            }
        });
    } else {
        const li = document.createElement("li");
        li.setAttribute("class", "task empty");
        li.innerHTML = "No task available"
        ul.appendChild(li);
    }

    ul.ondragover=(event) => {
        event.preventDefault();
        ul.classList.add("itemDrop");
    }
    ul.ondragleave = () => {
        ul.classList.remove("itemDrop");
    }
    ul.ondrop = (event) => {
        event.preventDefault();
        let id = event.dataTransfer.getData("id");
        if (id) {
            let categoryId = parseInt(id.split("=")[0]);
            
            if (categoryId === category.id) {
                const categoryEl = event.target.closest(".category");
                const sortableLists = categoryEl.getElementsByClassName("task");
                const newInput = [];
                Array.prototype.map.call(sortableLists, (el) => {
                    const id = parseInt(el.dataset.id);
                    const task = category.tasks.find((ipt) => ipt && ipt.id === id);
                    newInput.push(task);
                });
            
                category.tasks = newInput;
            } else {
                const fromCategory = inputs.find((ipt) => ipt && ipt.id === categoryId);
                let taskId = parseInt(id.split("=")[1]);
                const taskIndex = fromCategory.tasks.findIndex((task) => task && task.id === taskId);
                category.tasks.push(fromCategory.tasks[taskIndex]);
                fromCategory.tasks.splice(taskIndex, 1);
            }
            updateData();
        }
    };

    div1.appendChild(ul);
    div.appendChild(div1);

    return div;
}

function construct() {
    const container = document.getElementById("taskContainer");
    container.innerHTML = "";
    if (inputs && inputs.length) {
        inputs.forEach((input) => {
            if (input) {
                const div = document.createElement("div");
                div.setAttribute("class", containerClass);
                div.setAttribute("data-id", input.id);
                div.setAttribute('draggable', true);
                div.ondrag = (event) => {
                    const list = div.parentNode,
                        x = event.clientX,
                        y = event.clientY;
                    
                        div.classList.add('drag-sort-active');
                    let swapItem = document.elementFromPoint(x, y) === null ? div : document.elementFromPoint(x, y);
                    
                    if (list === swapItem.parentNode) {
                        swapItem = swapItem !== div.nextSibling ? swapItem : swapItem.nextSibling;
                        list.insertBefore(div, swapItem);
                    }
                };
                div.ondragend = () => {
                    div.classList.remove('drag-sort-active');
                    const sortableLists = document.getElementsByClassName(containerClass);
                    const newInput = [];
                    Array.prototype.map.call(sortableLists, (el) => {
                        const id = parseInt(el.dataset.id);
                        const category = inputs.find((ipt) => ipt && ipt.id === id);
                        newInput.push(category);
                    });

                    inputs = newInput;
                    updateData();
                };
                div.appendChild(getDragAndDropIcon("dragAndDrop"));
                div.appendChild(getTitle(input));
                div.appendChild(getDelete(input));
                div.appendChild(getNewTaskInput(input));
                div.appendChild(getNewTaskButton(input));
                div.appendChild(getMenu(input));
                div.appendChild(getTasks(input));
                container.appendChild(div);
            }
        })
    }
    container.appendChild(getNewTaskContainer());
}

function getNewTaskContainer() {
    const newDom = document.createElement("div");
    newDom.setAttribute("class", "new");

    const input = document.createElement("input");
    input.setAttribute("type", "text");
    input.setAttribute("class", "newCategoryTextBox");
    input.setAttribute("placeholder", "Enter new category name");
    input.onkeyup = (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            const newValue = input.value.trim();

            if (!newValue) {
                alert("Category name should not be empty");
                return;
            }

            inputs.push({
                id: new Date().getTime(),
                title: newValue,
                tasks: [],
                menuPreference: "all"
            });
            updateData();
        }
    }
    newDom.appendChild(input);
    return newDom;
}

async function randomQuote() {
    try {
        const response = await fetch("https://api.quotable.io/random");
        const newData = await response.json();
        document.getElementById("quote").innerHTML = `${newData.content} - ${newData.author}`;
    } catch (e) {}
}

function setColor() {
    const colorEl = document.getElementById("colorPicker");
    colorEl.value = preference.bgColor;
    if (preference.darkMode) {
        colorEl.addEventListener("click", () => {
            alert("Not supported in black theme");
        }, false);
    } else {
        document.body.style.backgroundColor = preference.bgColor;
        colorEl.addEventListener("change", () => {
            document.body.style.backgroundColor = colorEl.value;
            preference.bgColor = colorEl.value;
            updateData();
        }, false);
        colorEl.addEventListener("input", () => {
            document.body.style.backgroundColor = colorEl.value;        
        }, false);
    }
}

function setDarkMode() {
    const darkModeEl = document.getElementById("darkModeCheckBox");
    darkModeEl.checked = preference.darkMode;
    darkModeEl.addEventListener("change", () => {
        if (darkModeEl.checked) {
            document.body.classList.add("dark");
            preference.darkMode = true;
            document.body.style.backgroundColor = "#18191b";
        } else {
            document.body.classList.remove("dark");
            preference.darkMode = false;
            document.body.style.backgroundColor = preference.bgColor;
        }
        updateData();
    }, false);
    if (preference.darkMode) {
        document.body.classList.add("dark");
    }
}

function renderSort() {
    const sortSelectEl = document.getElementById("sortSelect");
    sortSelectEl.value = preference.sorting;
    sortSelectEl.onchange=() => {
        preference.sorting = sortSelectEl.value;
        updateData();
    }
}

function render() {
    construct();
    currentTime();
    setColor();
    setDarkMode();
    randomQuote();
    renderSort();
    updateStorageDisplay(); // Initialize storage display
}

document.addEventListener("DOMContentLoaded", () => {
    const defaultBustlerData = {
        preference: {
            name: null,
            bgColor: "#c8e4ff",
            darkMode: false,
            showDateAndTime: true,
            fontSize: 12,
            sorting: "own"
        },
        inputs: []
    }

    chrome.storage.sync.get(chromeDataName, (result) => {
        let storedData = JSON.parse(result?.bustlerData || '{}');
        storedData = {
            inputs: storedData.inputs || defaultBustlerData.inputs,
            preference: {
                ...defaultBustlerData.preference,
                ...(storedData.preference || {})
            }
        };

        inputs = storedData.inputs || [];
        preference = storedData.preference || {};

        if (preference.name === null) {
            let bossName = prompt("Please enter your name.");
            if (bossName) {
                preference.name = bossName;
                updateData();
                render();
            } else {
                render();
            }
        } else {
            render();
        }
        
        // Initialize search functionality
        initializeSearch();
    });
});

// Search functionality
function initializeSearch() {
    // Search toggle button
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchSection = document.getElementById('searchSection');
    
    searchToggleBtn.addEventListener('click', () => {
        const isVisible = searchSection.style.display !== 'none';
        if (isVisible) {
            searchSection.style.display = 'none';
            searchToggleBtn.classList.remove('active');
        } else {
            searchSection.style.display = 'block';
            searchToggleBtn.classList.add('active');
            // Focus on search input when opened
            document.getElementById('searchInput').focus();
        }
    });

    // Search button
    document.getElementById('searchBtn').addEventListener('click', () => {
        performContentSearch();
    });

    // Search input - trigger search on Enter key
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
            performContentSearch();
        }
    });

    // Clear search button
    document.getElementById('clearSearchBtn').addEventListener('click', () => {
        clearSearch();
    });
}

function performContentSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }

    const caseSensitive = document.getElementById('caseSensitive').checked;
    const wholeWords = document.getElementById('wholeWords').checked;
    const includeCompleted = document.getElementById('includeCompleted').checked;

    const results = searchTasksByContent(searchTerm, caseSensitive, wholeWords, includeCompleted);
    displaySearchResults(results, `Search results for "${searchTerm}"`);
}

function searchTasksByContent(searchTerm, caseSensitive = false, wholeWords = false, includeCompleted = true) {
    const results = [];
    
    // Prepare search term based on options
    let processedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    
    inputs.forEach(category => {
        if (category && category.tasks) {
            category.tasks.forEach(task => {
                if (task && task.name) {
                    // Skip completed tasks if not included
                    if (!includeCompleted && task.status === 'completed') {
                        return;
                    }

                    let taskContent = caseSensitive ? task.name : task.name.toLowerCase();
                    let isMatch = false;

                    if (wholeWords) {
                        // Create regex for whole word matching
                        const regex = new RegExp(`\\b${escapeRegex(processedSearchTerm)}\\b`, caseSensitive ? 'g' : 'gi');
                        isMatch = regex.test(taskContent);
                    } else {
                        // Simple substring search
                        isMatch = taskContent.includes(processedSearchTerm);
                    }

                    if (isMatch) {
                        results.push({
                            task: task,
                            category: category,
                            taskDate: new Date(task.id),
                            searchTerm: searchTerm,
                            caseSensitive: caseSensitive,
                            wholeWords: wholeWords
                        });
                    }
                }
            });
        }
    });

    // Sort results by relevance (exact matches first, then by date)
    results.sort((a, b) => {
        const aExactMatch = a.task.name.toLowerCase().includes(searchTerm.toLowerCase());
        const bExactMatch = b.task.name.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (aExactMatch && !bExactMatch) return -1;
        if (!aExactMatch && bExactMatch) return 1;
        
        // If both have same relevance, sort by date (newest first)
        return b.taskDate.getTime() - a.taskDate.getTime();
    });
    
    return results;
}

function displaySearchResults(results, title) {
    const searchResultsDiv = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResultsDiv.innerHTML = `
            <h5>${title}</h5>
            <div class="noSearchResults">No tasks found matching your search criteria.</div>
        `;
    } else {
        const resultsHTML = `
            <h5>${title} (${results.length} task${results.length > 1 ? 's' : ''})</h5>
            <div class="searchResultsContainer">
                ${results.map(result => createSearchResultCard(result)).join('')}
            </div>
        `;
        searchResultsDiv.innerHTML = resultsHTML;
    }
    
    searchResultsDiv.style.display = 'block';
    
    // Scroll to results
    searchResultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function createSearchResultCard(result) {
    const { task, category, taskDate, searchTerm, caseSensitive, wholeWords } = result;
    const formattedDate = formatDateTime(taskDate);
    const timeAgo = getTimeAgo(taskDate);
    
    // Highlight search term in task name
    let highlightedTaskName = escapeHtml(task.name);
    if (searchTerm) {
        highlightedTaskName = highlightSearchTerm(task.name, searchTerm, caseSensitive, wholeWords);
    }
    
    return `
        <div class="searchResultCard">
            <div class="categoryName">${escapeHtml(category.title)}</div>
            <div class="taskName">${highlightedTaskName}</div>
            <div class="taskDate">Created: ${formattedDate} (${timeAgo})</div>
            <div class="taskStatus ${task.status}">${task.status}</div>
        </div>
    `;
}

function highlightSearchTerm(text, searchTerm, caseSensitive = false, wholeWords = false) {
    if (!searchTerm) return escapeHtml(text);
    
    let escapedText = escapeHtml(text);
    const flags = caseSensitive ? 'g' : 'gi';
    
    if (wholeWords) {
        const regex = new RegExp(`\\b(${escapeRegex(searchTerm)})\\b`, flags);
        return escapedText.replace(regex, '<span class="highlight">$1</span>');
    } else {
        const regex = new RegExp(`(${escapeRegex(searchTerm)})`, flags);
        return escapedText.replace(regex, '<span class="highlight">$1</span>');
    }
}

function clearSearch() {
    // Clear search results
    const searchResultsDiv = document.getElementById('searchResults');
    searchResultsDiv.style.display = 'none';
    searchResultsDiv.innerHTML = '';
    
    // Clear search input
    document.getElementById('searchInput').value = '';
    
    // Reset search options
    document.getElementById('caseSensitive').checked = false;
    document.getElementById('wholeWords').checked = false;
    document.getElementById('includeCompleted').checked = true;
}

// Helper functions
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(date) {
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths > 0) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    } else if (diffWeeks > 0) {
        return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    } else if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes > 0) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}