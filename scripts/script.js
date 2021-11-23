const RootComponent = {
    data() {
        let svg = this.getSvg();
        return {
            darkMode: true,
            allowCode: false,
            svgUrl: "",
            svgFile: "",
            svg: {
                svg,
                name: 'defaultFile.svg'
            },
            parameters: this.getParameters(svg)
        };
    },
    methods: {
        getSvg() {

            return `<svg>
            <line x1="0" x2="300" y1="0" y2="0"/>
            <text x="10" y="10">{{m:range(min:0.1,max:2,step:0.1)|1}}</text>
            <text x="10" y="30">{{b:range(min:1,max:10)|5}}</text>
            <text x="10" y="50">{{c:range(min:0,max:10,step:0.1)|0}}</text>
            <text x="10" y="70">m+b = {{{m+b}}}</text>
            <text x="10" y="90">m*b = {{{m*b}}}</text>
            <text x="10" y="110">plot = m*(x+c)²+b:</text>
            <g transform="translate(10 210)">
                <path d="{{{ (()=>{var d=''; console.log(c); for(var x=0;x<=100;x++){d+=(x==0?'M':'L')+x+' '+(100-((x+c)*(x+c)*m+b*100)/100);} return d;})() }}}" stroke="red" fill="none" stroke-width="1"/>
            </g>
            </svg>`;

            let values = [{ name: "none", value: "none" },
            { name: "default", value: "" },
            { name: "black", value: "black" },
            { name: "red", value: "red" },
            { name: "blue", value: "blue" },
            { name: "#red", value: "#ff0000" },
            { name: "#blue", value: "#0000ff" },
            { name: "#r", value: "#f00" },
            { name: "#b", value: "#00f" },
            { name: "light", value: "#b5b5b5" },
            { name: "dark", value: "#4b4b4b" },
            { name: "green", value: "lawngreen" },
            { name: "purple", value: "purple" }
            ];

            let width = 20 + 34 * values.length;

            let svg = `<svg viewBox="-20 -20 ${width} ${width}">
<text font-size="6" font-weight="bold" text-anchor="end" transform="translate(-4 2) rotate(30)">stroke</text>
<text font-size="6" font-weight="bold" text-anchor="end" transform="translate(2 -4) rotate(30)">fill</text>
`;
            let pos = 20;
            for (let val of values) {
                svg += `<text font-size="6" text-anchor="end" transform="translate(-2 ${pos}) rotate(30)">${val.name}</text>
`;
                svg += `<text font-size="6" text-anchor="end" transform="translate(${pos} -2) rotate(30)">${val.name}</text>
`;
                pos += 34;
            }

            let fPos = 17;
            for (let fill of values) {
                let sPos = 17;
                for (let stroke of values) {
                    if (fill.value && stroke.value)
                        svg += `<circle r="15" cx="${fPos}" cy="${sPos}" style="fill:${fill.value};stroke:${stroke.value}"></circle>`;
                    else if (fill.value)
                        svg += `<circle r="15" cx="${fPos}" cy="${sPos}" style="fill:${fill.value}"></circle>`;
                    else if (stroke.value)
                        svg += `<circle r="15" cx="${fPos}" cy="${sPos}" style="stroke:${stroke.value}"></circle>`;
                    else
                        svg += `<circle r="15" cx="${fPos}" cy="${sPos}" style=""></circle>`;
                    sPos += 34;
                }
                fPos += 34;
            }
            svg += "</svg>";
            return svg;
        },
        forceRerender() {
            this.componentKey += 1;
        },
        loadFile() {
            this.$refs.fileInput.click();
        },
        updateFile(event) {
            if (event.target.files) {
                this.svgFile = event.target.files[0].name;

                let reader = new FileReader();
                reader.onload = (evt) => {
                    this.svg = {
                        svg: evt.target.result,
                        name: this.svgFile
                    };
                    this.parameters = [];
                };
                reader.readAsText(event.target.files[0], "UTF-8");

                event.target.value = null;
            }
        },
        getParameters(svg) {
            let parameterRegex = /\{\{(?<name>[^:}|]*)(:(?<type>[^|}]*))?(\|(?<defaultValue>[^}]*))?\}\}(?=[^}])/gm;
            let match;
            let parameters = [];

            function getValue(type, defaultValue) {
                if (defaultValue) {
                    if (type && type.name)
                        switch (type.name) {
                            case 'range':
                                return Number(defaultValue);
                        }
                    return defaultValue;
                }
                return "?";
            }

            let functionRegex = /(?<=\()[^)]*(?=\))/;

            function getType(type, defaultValue) {
                if (!type)
                    return 'text';

                let functionMatch = functionRegex.exec(type);

                if (functionMatch) {
                    let retType = {
                        name: type.split('(')[0]
                    };

                    let functionParameterRegex = /(?<name>[^,:]*):(?<value>[^,]*)/g;

                    let params;

                    while (params = functionParameterRegex.exec(functionMatch[0])) {
                        retType[params.groups.name] = params.groups.value;
                    }

                    if (retType.type == 'range') {
                        if (!retType.min && !retType.max) {
                            retType.min = 0;
                            retType.max = Math.pow(10, Math.ceil(Math.log10(Number(defaultValue))));
                        } else if (!retType.min && retType.max) {
                            retType.max = Math.pow(10, Math.ceil(Math.log10(Math.max(Number(defaultValue), retType.min))));
                        } else if (!retType.max) {
                            retType.max = retType.min;
                            retType.min = 0;
                        }
                        if (!retType.step)
                            retType.step = 1;
                    }

                    return retType;
                }
                return type;
            }

            do {
                match = parameterRegex.exec(svg);
                if (match) {
                    let param = {};
                    param.name = match.groups.name;
                    param.type = getType(match.groups.type, match.groups.defaultValue);
                    param.value = getValue(param.type, match.groups.defaultValue);

                    if (!parameters.find(x => x.name == param.name))
                        parameters.push(param);
                }
            } while (match);

            console.log(parameters);
            return parameters;
        }

    },
    watch: {
        darkMode(newValue, oldValue) {
            if (newValue)
                document.getElementsByTagName('html')[0].classList.add('darkmode');
            else
                document.getElementsByTagName('html')[0].classList.remove('darkmode');
        },
        svg(newValue, oldValue) {
            this.parameters = getParameters(this.svg.svg);
        }
    }
}

const app = Vue.createApp(RootComponent);

app.component("parameter", {
    template: `
    <div> {{name}}
        <input v-if="type === 'text'" v-model="value" />
        <input v-else-if="type === 'number'" v-model.number="value" type="number" />
        <div v-else-if="type.name === 'range'" style="display:inline-block">
            <input v-model.number="value" type="range" :min="type.min" :max="type.max" :step="type.step" />
            <input v-model.number="value" type="number" :min="type.min" :max="type.max"  :step="type.step" />
        </div>
        <div v-else> unknown Type ({{(typeof type)}})'{{type}}'</div>
    </div>
    `,
    emits: {
        input: null
    },
    props: {
        parameter: Object
    },
    data() {
        return this.parameter;
    },
    watch: {
        // whenever question changes, this function will run
        value(newValue, oldValue) {
            this.$emit("input", { newValue, oldValue });
        }
    }
});

function evalInScope(js, contextAsScope) {
    //# Return the results of the in-line anonymous function we .call with the passed context
    return function () { with (this) { return eval(js); }; }.call(contextAsScope);
}

app.component("svg-renderer", {
    template: `
<div>
    <button @click="saveSvg()" title="save" style="margin-bottom:20px">
        <i class="fas fa-file-export"></i>
    </button>
    <div v-html="renderedSvg"></div>
    <div style="opacity: 0" ref="svgMeasure"></div>
</div>`,
    props: {
        parameters: Array,
        svg: Object,
        allowCode: Boolean
    },
    data() {
        return {
            renderedSvg: "LOADING ..."
        };
    },
    methods: {
        renderSvg() {
            let renderedSvg = this.svg.svg;
            //replace calculations
            if (this.allowCode) {
                let scope = {};
                for (let param of this.parameters)
                    scope[param.name] = param.value;

                let match;
                do {
                    match = new RegExp(`\{\{\{(?<calc>.*?)\}\}\}`, 'gm').exec(renderedSvg);
                    if (match) {
                        let result = evalInScope(match.groups.calc, scope);
                        renderedSvg = renderedSvg.substr(0, match.index) + result + renderedSvg.substr(match.index + match[0].length);
                    }
                }
                while (match);
            } else {
                let match
                do {
                    match = new RegExp(`\{\{\{([^}]*)\}\}\}`, 'gm').exec(renderedSvg);
                    if (match) {
                        renderedSvg = renderedSvg.substr(0, match.index) + "" + renderedSvg.substr(match.index + match[0].length);
                    }
                }
                while (match);
            }

            for (let param of this.parameters) {
                //replace parameters
                let match
                do {
                    match = new RegExp(`\{\{(${param.name})(:[^}]*)?(|[^}]*)?\}\}`, 'gm').exec(renderedSvg);
                    if (match) {
                        renderedSvg = renderedSvg.substr(0, match.index) + param.value + renderedSvg.substr(match.index + match[0].length);
                    }
                }
                while (match);
            }

            if (this.$refs.svgMeasure) {
                this.$refs.svgMeasure.innerHTML = renderedSvg;
                let bbox = this.$refs.svgMeasure.children[0].getBBox({ stroke: true });
                bbox.width = Math.max(0.1, bbox.width);
                bbox.height = Math.max(0.1, bbox.height);

                let viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;

                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(renderedSvg, "text/xml");

                xmlDoc.children[0].setAttribute("viewBox", viewBox);

                let serializer = new XMLSerializer();
                renderedSvg = serializer.serializeToString(xmlDoc);
            }

            this.renderedSvg = renderedSvg;
        },
        saveSvg() {
            this.triggerDownload('data:image/svg+xml;base64,' + Base64.encode(this.renderedSvg));
        },
        triggerDownload(imgURI) {
            let evt = new MouseEvent('click', {
                view: window,
                bubbles: false,
                cancelable: true
            });

            let a = document.createElement('a');
            a.setAttribute('download', this.svg.name);
            a.setAttribute('href', imgURI);
            a.setAttribute('target', '_blank');

            a.dispatchEvent(evt);
        }
    },
    watch: {
        $props: {
            handler() {
                this.renderSvg();
            },
            deep: true,
            immediate: true,
        }
    }
});

const vm = app.mount('#app');