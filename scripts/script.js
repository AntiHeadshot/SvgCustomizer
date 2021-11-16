const RootComponent = {
    data() {
        return {
            darkMode: false,
            svgUrl: "",
            svgFile: "",
            svg: {
                svg: this.getSvg(),
                name: 'defaultFile.svg'
            },
            parameters: [
                { name: "testParam1", type: "text", value: "Hello" },
                { name: "testParam2", type: "number", value: 10 },
                { name: "testParam3", type: { name: 'range', min: 30, max: 100 }, value: 80 }
            ],
        };
    },
    methods: {
        getSvg() {
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
            { name: "green", value: "lawngreen" }];

            let width = 20 + 34 * values.length;

            let svg = `<svg viewBox="-20 -20 ${width} ${width}">
<text font-size="6" text-anchor="end" transform="translate(-4 2) rotate(45)">stroke</text>
<text font-size="6" text-anchor="end" transform="translate(2 -4) rotate(45)">fill</text>
`;
            let pos = 8
            for (let val of values) {
                svg += `<text font-size="6" text-anchor="end" transform="translate(-2 ${pos}) rotate(30)">${val.name}</text>
`;
                svg += `<text font-size="6" text-anchor="end" transform="translate(${pos} -2) rotate(60)">${val.name}</text>
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
                    sPos += 43;
                }
                fPos += 34;
            }

            svg += "</svg>";
            return svg;
        },
        forceRerender() {
            this.componentKey += 1;
        },
        updateFile(event) {
            if (event.target.files) {
                var reader = new FileReader();
                reader.onload = (evt) => {
                    this.svg = {
                        svg: evt.target.result,
                        name: event.target.files[0].name
                    };
                    this.parameters = [];
                };
                reader.readAsText(event.target.files[0], "UTF-8");
            }
        }
    },
    watch: {
        darkMode(newValue, oldValue) {
            console.log("mode changed");
            if (newValue)
                document.getElementsByTagName('html')[0].classList.add('darkmode');
            else
                document.getElementsByTagName('html')[0].classList.remove('darkmode');
        }
        , svg(newValue, oldValue) {
            let parameterRegex = /\{\{(?<name>[^:}]*)(:(?<type>[^|}]*))?(\|(?<defaultValue>[^}]*))?\}\}/gm;
            let match;
            let parameters = [];

            function getValue(type, defaultValue) {
                if (defaultValue)
                    return defaultValue;
                return "?";
            }

            function getType(type, defaultValue) {
                if (!type)
                    return 'text';
                if (type.startsWith('range')) {
                    let retType = {
                        type: 'range',
                        min: 0,
                        max: 0
                    };

                    let rangeRegex = /range\( *(?<min>\d+) *(, *(?<max>\d+) *)?\))/;
                    let rangeMatch = rangeRegex.exec(type);

                    if (!rangeMatch.groups.min) {
                        retType.min = 0;
                        retType.max = Math.pow(10, Math.ceil(Math.log10(Number(defaultValue))));
                    } else if (!rangeMatch.groups.max) {
                        retType.min = 0;
                        retType.max = rangeMatch.groups.min;
                    } else {
                        retType.min = rangeMatch.groups.min;
                        retType.max = rangeMatch.groups.max;
                    }

                    return retType;
                }
                return type;
            }

            do {
                match = parameterRegex.exec(this.svg.svg);
                if (match) {
                    let param = {
                        name: match.groups.name,
                        type: getType(match.groups.type, match.groups.defaultValue),
                        value: getValue(match.groups.type, match.groups.defaultValue)
                    };

                    if (!parameters.find(x => x.name == param.name))
                        parameters.push(param);
                }
            } while (match);

            this.parameters = parameters;
        }
    }
}

const app = Vue.createApp(RootComponent);

app.component("parameter", {
    template: `
    <div> {{name}}
        <input v-if="type === 'text'" v-model="value" />
        <input v-else-if="type === 'number'" v-model="value" type="number" />
        <div v-else-if="type.name === 'range'" style="display:inline-block"><input v-model="value" type="range" :min="type.min" :max="type.max" /> {{value}}</div>
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

app.component("svg-renderer", {
    template: `<div><button @click="saveSvg()">save</button><div v-html="renderedSvg"></div><div style="opacity: 0" ref="svgMeasure"></div></div>`,
    props: {
        parameters: Array,
        svg: Object,
    },
    data() {
        return {
            renderedSvg: "LOADING ..."
        };
    },
    methods: {
        renderSvg() {
            let renderedSvg = this.svg.svg;
            for (let param of this.parameters) {
                do {
                    var match = new RegExp(`\{\{(${param.name})(:[^}]*)?\}\}`, 'gm').exec(renderedSvg);
                    if (match) {
                        renderedSvg = renderedSvg.substr(0, match.index) + param.value + renderedSvg.substr(match.index + match[0].length);
                    }
                }
                while (match);
            }

            if (this.$refs.svgMeasure) {
                this.$refs.svgMeasure.innerHTML = renderedSvg;
                let bbox = this.$refs.svgMeasure.children[0].getBBox();
                let viewBox = `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`;

                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(renderedSvg, "text/xml");

                xmlDoc.children[0].setAttribute("viewBox", viewBox);

                var serializer = new XMLSerializer();
                renderedSvg = serializer.serializeToString(xmlDoc);
            }

            this.renderedSvg = renderedSvg;
        },
        saveSvg() {
            this.triggerDownload('data:image/svg+xml;base64,' + Base64.encode(this.renderedSvg));
        },
        triggerDownload(imgURI) {
            var evt = new MouseEvent('click', {
                view: window,
                bubbles: false,
                cancelable: true
            });

            var a = document.createElement('a');
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
        },
    }
});

const vm = app.mount('#app');