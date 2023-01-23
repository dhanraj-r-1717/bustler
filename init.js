let inputs = [];
let containerClass = "category";

function getPlusSymbol() {
    return "<span>&#43;</span>";
}

function currentTime() {
    let date = new Date(); 
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();
    let session = "AM";
  
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
      
     let time = hh + ":" + mm + " " + session;
  
    document.getElementById("clock").innerHTML = time; 
    let t = setTimeout(() => { currentTime() }, 1000 * 60);
}

function handleDrag(item) {
    const selectedItem = item.target,
          list = selectedItem.parentNode,
          x = event.clientX,
          y = event.clientY;
    
    selectedItem.classList.add('drag-sort-active');
    let swapItem = document.elementFromPoint(x, y) === null ? selectedItem : document.elementFromPoint(x, y);
    
    if (list === swapItem.parentNode) {
        swapItem = swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling;
        list.insertBefore(selectedItem, swapItem);
    }
}

function handleCategoryDrop(item) {
    item.target.classList.remove('drag-sort-active');

    const sortableLists = document.getElementsByClassName(containerClass);
    const newInput = [];
    Array.prototype.map.call(sortableLists, (el) => {
        const id = parseInt(el.dataset.id);
        const category = inputs.find((ipt) => ipt && ipt.id === id);
        newInput.push(category);
    });

    inputs = newInput;
    updateData();
}

function handleTaskDrop(item) {
    item.target.classList.remove('drag-sort-active');

    const categoryId = parseInt(item.target.closest(".category").dataset.id);
    const category = inputs.find((ipt) => ipt && ipt.id === categoryId);

    const sortableLists = document.getElementsByClassName("task");
    const newInput = [];
    Array.prototype.map.call(sortableLists, (el) => {
        const id = parseInt(el.dataset.id);
        const task = category.tasks.find((ipt) => ipt && ipt.id === id);
        newInput.push(task);
    });

    category.tasks = newInput;
    updateData();
}

function enableDragItem(item, dropFunc) {
    item.setAttribute('draggable', true)
    item.ondrag = handleDrag;
    item.ondragend = dropFunc;
}

function enableDragSort(containerClassName, dropFunc) {
    const sortableLists = document.getElementsByClassName(containerClassName);
    Array.prototype.map.call(sortableLists, (list) => {enableDragItem(list, dropFunc)});
}

function updateData() {
    chrome.storage.sync.set({'bustlerData': JSON.stringify(inputs)}, () => {
        render();
    });
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
    input.onclick = (event) => {
        const newValue = event.target.value.trim();
        
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

function getMenu(category) {
    const { menuPreference } = category;

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
    a.innerHTML = "All";
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
    a.innerHTML = "Active";
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
    a.innerHTML = "Completed";
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
    const {tasks, menuPreference} = category;
    let filteredTasks = tasks;

    if (menuPreference !== "all") {
        filteredTasks = filteredTasks.filter((task) => {
            if (menuPreference === "active" && task.status === "active") {
                return true;
            }
            if (menuPreference === "completed" && task.status === "completed") {
                return true;
            }
            return false;
        });
    }

    const div = document.createElement("div");
    div.setAttribute("class", "menuContent");

    const div1 = document.createElement("div");
    div1.setAttribute("id", "all");

    const ul = document.createElement("ul");
    ul.setAttribute("class", "taskContainer");

    if (filteredTasks.length) {
        filteredTasks.forEach((task) => {
            if (task) {
                const li = document.createElement("li");
                li.setAttribute("class", "task " + task.status);
                li.setAttribute("data-id", task.id);

                li.appendChild(getDragAndDropIcon("taskDragAndDrop"));
        
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
                
                ul.appendChild(li);
            }
        });
    } else {
        const li = document.createElement("li");
        li.setAttribute("class", "task empty");
        li.innerHTML = "No task available"
        ul.appendChild(li);
    }

    div1.appendChild(ul);
    div.appendChild(div1);

    return div;
}

function render() {
    const container = document.getElementById("taskContainer");
    container.innerHTML = "";
    if (inputs && inputs.length) {
        inputs.forEach((input) => {
            if (input) {
                const div = document.createElement("div");
                div.setAttribute("class", containerClass);
                div.setAttribute("data-id", input.id);
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
    enableDragSort(containerClass, handleCategoryDrop);
    enableDragSort("task", handleTaskDrop);
}

function getNewTaskContainer() {
    const newDom = document.createElement("div");
    newDom.innerHTML = getPlusSymbol();
    newDom.setAttribute("class", "new");
    newDom.onclick = () => {
        let newTaskName = prompt("Please enter the task category name");
        if (newTaskName) {
            inputs.push({
                id: new Date().getTime(),
                title: newTaskName,
                tasks: [],
                menuPreference: "all"
            });
            updateData();
        }
    }
    return newDom;
}

document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.sync.get("bustlerData", (result) => {
        inputs = JSON.parse(result?.bustlerData || '[]');
        render();
        currentTime();
    });
});