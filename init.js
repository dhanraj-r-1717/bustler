let inputs = [];

function getPlusSymbol() {
    return "<span>&#43;</span>";
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
            const li = document.createElement("li");
            li.setAttribute("class", "task " + task.status);
    
            const checkbox = document.createElement("input");
            checkbox.setAttribute("type", "checkbox");
            if (task.status === "completed") {
                checkbox.setAttribute("checked", true);
            }
            checkbox.onchange = (event) => {
                task.status = event.target.checked ? "completed" : "active";
                updateData();
            }
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
            const div = document.createElement("div");
            div.setAttribute("class", "category");
            div.setAttribute("data-id", input.id);
            div.appendChild(getTitle(input));
            div.appendChild(getDelete(input));
            div.appendChild(getNewTaskInput(input));
            div.appendChild(getNewTaskButton(input));
            div.appendChild(getMenu(input));
            div.appendChild(getTasks(input));
            container.appendChild(div);
        })
    }
    container.appendChild(getNewTaskContainer());
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
    });
});