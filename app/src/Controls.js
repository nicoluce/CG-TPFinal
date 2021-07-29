let controlsContainer = document.getElementById('controls');

export class CheckboxControl {
  constructor(name, props, onInput, storeInCache = true) {
    const id = `${this.group}-${name}`;

    const container = document.createElement('div');
    container.id = id;
    container.classList = ['ui row'];
    container.style.display = 'flex';
    container.style.justifyContent = "space-between";

    const label = document.createElement('label');
    const checkbox = document.createElement('input');

    label.id = `${id}-label`;
    label.value = name;
    label.innerText = name;
    label.style.color = "#000000";

    checkbox.id = `${id}-checkbox`;
    checkbox.type = 'checkbox';
    checkbox.style.marginRight = "10px";

    Object.entries(props).forEach(([prop, value]) => checkbox[prop] = value);
    Object.entries(props).forEach(([prop, value]) => label[prop] = value);
    checkbox.value = (storeInCache && localStorage.getItem(name)) || props["value"] || props["min"] || props["max"];

    checkbox.onchange = (e) => {
      new Promise(() => {
        storeInCache && localStorage.setItem(name, e.target.checked);
        onInput(e.target.checked, e);
        window.dispatchEvent(new Event('draw'));
      });
    };

    container.appendChild(label);
    container.appendChild(checkbox);
    
    return container;
  }
}

export class SliderControl {
  constructor(name, props, onInput, updateEveryChange = true, storeInCache = true) {
    const id = `${this.group}-${name}`;

    const container = document.createElement('div');
    container.id = id;
    container.classList = ['ui row'];
    container.style.display = 'flex';
    container.style.justifyContent = "space-between";

    const label = document.createElement('label');
    const slider = document.createElement('input');
    const input = document.createElement('input');

    label.id = `${id}-label`;
    label.value = name;
    label.innerText = name;
    label.style.width = "min-content";
    label.style.color = "#000000";

    slider.id = `${id}-slider`;
    slider.type = 'range';
    slider.classList = ['slider'];
    slider.style.width = "40%";
    slider.style.marginRight = "10px";

    Object.entries(props).forEach(([prop, value]) => slider[prop] = value);
    slider.value = (storeInCache && localStorage.getItem(name)) || props["value"] || props["min"] || props["max"];

    slider.oninput = (e) => { input.value = e.target.value;
      new Promise(() => {
        input.value = e.target.value;
        if (updateEveryChange) {
          onInput(e.target.value, e);
          window.dispatchEvent(new Event('draw'));
        }
      }); };
    slider.onmouseup = (e) => {
      input.value = e.target.value;
      storeInCache && localStorage.setItem(name, e.target.value);
      new Promise(() => {
        onInput(e.target.value, e);
        window.dispatchEvent(new Event('draw'));
      });
    };
    

    input.id = `${id}-input`;
    input.style.width = "30%";
    input.value = (storeInCache && localStorage.getItem(name)) || props["value"] || props["min"] || props["max"];
    input.oninput = (e) => {
      input.style.backgroundColor = "#e68181"
    };
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        onInput(e.target.value, e);
        slider.value = e.target.value;
        window.dispatchEvent(new Event('draw'));
      }
      input.style.backgroundColor = "#FFFFFF"
    }

    container.appendChild(label);
    container.appendChild(slider);
    container.appendChild(input);
    
    return container;
  }
}

export class GradientControl {
  gradient = [];
  constructor(name, onInput) {
    this.container = document.createElement('div');
    this.name = name;

    this.container.id = `${this.name}-container`;
    this.container.innerHTML = `
      <div class="ui accordion">
        <div class="active title">
          <i class="dropdown icon"></i>
          Color gradient
        </div>
        <div class="active content">
          <div class="ui list"></div>
          <div class="ui icon circular button new-gradient">
          +
          </div>
        </div>
      </div>
    `.trim();

    const button = this.container.getElementsByClassName('new-gradient')[0];
    button.onclick = () => { this.addNewColor();};

    this.onInput = onInput;

    try {
      const savedGradient = JSON.parse(localStorage.getItem(this.name)) || [];
      savedGradient.forEach(({ pos, color }) => {
        this.addNewColor(pos, color);
      });
    } catch {
    } finally {
      if (this.gradient.length === 0) {
        this.addNewColor(0.0, '#000000');
        this.addNewColor(1.0, '#ffffff');
        localStorage.setItem(this.name, JSON.stringify(this.gradient));
      }
    }

    return this.container;
  }

  addNewColor(positionValue = 1.0, colorValue = '#FFFFFF') {
    const list = this.container.getElementsByClassName('ui list')[0];
    const idx = list.children.length;
    const id = `${this.name}-${idx}`;
    const newGradPoint = document.createElement('div');

    newGradPoint.id = id;
    newGradPoint.classList = ['ui row'];
    newGradPoint.style.display = 'flex';
    newGradPoint.style.justifyContent = "space-between";
    
    const color = document.createElement('input');
    const input = document.createElement('input');

    color.id = `${id}-color`;
    color.type = 'color';
    color.style.marginRight = "10px";
    color.value = colorValue;
    color.style.width = "30%";

    color.oninput = (e) => {
      new Promise(() => {
        this.gradient[idx] = {
          color: e.target.value,
          pos: input.value
        };
        localStorage.setItem(this.name, JSON.stringify(this.gradient));
        this.onInput(this.gradient);
        window.dispatchEvent(new Event('draw'));
      }); };

    input.id = `${id}-input`;
    input.style.width = "30%";
    input.value = Number(positionValue).toFixed(1);
    input.oninput = (e) => {
      input.style.backgroundColor = "#e68181"
    };
    input.onkeypress = (e) => {
      if (e.key === "Enter") {
        this.gradient[idx] = {
          color: color.value,
          pos: e.target.value
        };
        localStorage.setItem(this.name, JSON.stringify(this.gradient));
        this.onInput(this.gradient);
        this.sortColors();
        window.dispatchEvent(new Event('draw'));
      }
      input.style.backgroundColor = "#FFFFFF"
    }

    newGradPoint.appendChild(input);
    newGradPoint.appendChild(color);

    list.appendChild(newGradPoint);

    this.gradient.push({
      color: colorValue,
      pos: positionValue
    });

    this.onInput(this.gradient);
    window.dispatchEvent(new Event('draw'));
  };

  sortColors() {
    const list = this.container.getElementsByClassName('ui list')[0];
    const rows = list.childNodes;
    const array = [];
    rows.forEach((r) => {
      if (r.nodeType == 1) { // get rid of the whitespace text nodes
        array.push({ node: r, value: r.childNodes[1].value });
      }
    });

    array.sort(function(a, b) {
      return a.value - b.value;
    });
    for (let i = 0; i < array.length; ++i) {
      list.appendChild(array[i].node);
    }
  }

}

export class Controls {
  constructor(name) {
    this.group = name;
    controlsContainer = controlsContainer || document.getElementById('controls');

    if (document.getElementById(`${this.group}-control-group`)) {
      throw new Error(`Ya existe un control group llamado ${name}`);
    }


    this.container = document.createElement('div');
    const label = document.createElement('h3');

    this.container.classList = ['ui segment'];
    this.container.id = `${this.group}-control-group`;

    label.id = `${this.group}-label`;
    label.classList = ['ui header'];
    label.value = this.group;
    label.innerText = this.group;
    label.style.color = "#000000";

    this.container.appendChild(label);
    controlsContainer.appendChild(this.container);
  };

  addControl(control) {
    this.container.appendChild(control);
  }

  remove() {
    this.container.remove();
  }
};

export class TabControls extends Controls {
  constructor(name, onAddTab, onDeleteTab) {
    super(name);

    this.tabular = document.createElement('div');
    this.tabular.classList = ['ui tabular menu'];

    this.container.appendChild(this.tabular);

    const item = document.createElement('a');
    item.classList = ['item'];
    item.innerText = '+';
    item['data-tab'] = 0;
    item.style.color = '#000000';

    item.onclick = onAddTab;
    this.onDeleteTab = onDeleteTab;

    this.tabular.append(item);

    this.tabs = {};
  }

  pushTabGroup(name) {
    this.container = document.getElementById(`${this.group}-control-group`);
    const i = this.tabular.children?.length || 1;

    const item = document.createElement('div');
    item.classList = ['item'];
    item.innerText = name;
    item['data-tab'] = i;
    item.style.width = '40%';

    const closeButton = document.createElement('div');
    closeButton.classList = ['ui right floated basic red tiny circular button'];
    closeButton.innerText = 'X';

    const tab = new Controls(name);
    tab.container.classList = ['ui bottom attached tab segment'];
    tab.container['data-tab'] = i;

    const activateTab = () => {
      Object.entries(this.tabs).forEach(([k, { item: otherItem, tab: otherTab }]) => {
        if (tab.group === otherTab.group) return;
        otherItem.classList.remove('active');
        otherTab.container.classList.remove('active');
      });
      item.classList.toggle('active');
      tab.container.classList.toggle('active');
    };

    item.onclick = activateTab;

    closeButton.onclick = () => {
      item.remove();
      tab.remove();
      delete this.tabs[name];
      this.onDeleteTab(i-1);
    };

    item.append(closeButton);

    this.tabs[name] = { item, tab };
    this.tabular.append(item);
    this.container.append(tab.container);

    activateTab();
  }

  addControl(tab, control) {
    this.tabs[tab].tab.addControl(control);
  }
}