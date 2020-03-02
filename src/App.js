import React, { Component } from 'react';
import './App.css';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { SketchPicker } from 'react-color';
import reactCSS from 'reactcss';

am4core.useTheme(am4themes_animated);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      threshold: 0.6,
      displayColorPicker: false,
      displayPositiveColorPicker: false,
      displayNegativeColorPicker: false,
      positiveCorrelationColor: hexToRgb('#4F75D2'),
      negativeCorrelationColor: hexToRgb('#DF3C3C'),
      data: [{ "variable1": "", "var1_domain": "", "variable2": "", "var2_domain": "", "coef": "0", "value": "0", "linkColor": "#c1cc3d", "rounded": "0" }]
    };
    this.handleThresholdChange = this.handleThresholdChange.bind(this);
    this.handleThresholdSubmit = this.handleThresholdSubmit.bind(this);
  }

  componentDidUpdate() {
    // Export
    let chart = am4core.create("chartdiv", am4charts.ChordDiagram);
    chart.exporting.menu = new am4core.ExportMenu();
    chart.exporting.filePrefix = "exposome-globe";

    // Color settings
    chart.colors.saturation = 0.45;

    chart.data = this.state.filteredData;
    // Read data from JSON file
    chart.dataFields.fromName = "var1_domain";
    chart.dataFields.toName = "var2_domain";
    chart.dataFields.value = "value";

    // Chart spacing settings
    chart.nodePadding = 0.5;
    chart.minNodeSize = 0.01;
    chart.sortBy = "value";
    chart.fontSize = 15;
    // ?
    chart.fontFamily = "Open Sans";
    //hart.textDecoration


    var nodeTemplate = chart.nodes.template;
    nodeTemplate.propertyFields.fill = "color";

    // Highlight links when hovering over node
    nodeTemplate.events.on("over", function (event) {
      var node = event.target;
      node.outgoingDataItems.each(function (dataItem) {
        if (dataItem.toNode) {
          dataItem.link.isHover = true;
          dataItem.toNode.label.isHover = true;
        }
      })
      node.incomingDataItems.each(function (dataItem) {
        if (dataItem.fromNode) {
          dataItem.link.isHover = true;
          dataItem.fromNode.label.isHover = true;
        }
      })
      node.label.isHover = true;
    })

    // When un-hovering from node, un-hover over links
    nodeTemplate.events.on("out", function (event) {
      var node = event.target;
      node.outgoingDataItems.each(function (dataItem) {
        if (dataItem.toNode) {
          dataItem.link.isHover = false;
          dataItem.toNode.label.isHover = false;
        }
      })
      node.incomingDataItems.each(function (dataItem) {
        if (dataItem.fromNode) {
          dataItem.link.isHover = false;
          dataItem.fromNode.label.isHover = false;
        }
      })
      node.label.isHover = false;
    })

    // Node label formatting
    var label = nodeTemplate.label;
    label.relativeRotation = 90;
    label.fillOpacity = 0.4;
    label.marginTop = 100;
    let labelHS = label.states.create("hover");
    labelHS.properties.fillOpacity = 1;

    // Hover formatting
    nodeTemplate.cursorOverStyle = am4core.MouseCursorStyle.pointer;

    // Link formatting
    var linkTemplate = chart.links.template;
    linkTemplate.strokeOpacity = 0;
    linkTemplate.fillOpacity = 0.15;
    linkTemplate.tooltipText = "{variable1} → {variable2}: {label}";
    linkTemplate.colorMode = "solid";
    linkTemplate.propertyFields.fill = "linkColor";
    chart.sortBy = "name";
    linkTemplate.clickable = false;

    var hoverState = linkTemplate.states.create("hover");
    hoverState.properties.fillOpacity = 1.0;
    hoverState.properties.strokeOpacity = 1.0;

  }

  componentWillUnmount() {
    if (this.chart) {
      this.chart.dispose();
    }
  }

  onFileChange = (event) => {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);
    let that = this;
    reader.onload = function (event) {
      let data = loadCSV(event.target.result);
      let filteredData = data.filter(
        function (x) { return Math.abs(parseFloat(x.coef)) >= that.state.threshold; }
      );
      for (let i = 0; i < filteredData.length; i++) {
        let positiveColor = rgbToHex(that.state.positiveCorrelationColor.r, that.state.positiveCorrelationColor.g, that.state.positiveCorrelationColor.b);
        let negativeColor = rgbToHex(that.state.negativeCorrelationColor.r, that.state.negativeCorrelationColor.g, that.state.negativeCorrelationColor.b);
        filteredData[i].linkColor = getColorDichromatic(parseFloat(filteredData[i].coef), positiveColor, negativeColor);
        console.log(filteredData[i].linkColor)
        filteredData[i].value = Math.abs(parseFloat(filteredData[i].coef));
        filteredData[i].label = Math.round(parseFloat(filteredData[i].coef) * 1000) / 1000;
      }
      that.setState({ data: data });
      that.setState({ filteredData: filteredData });
    };
  };

  handleThresholdChange(event) {
    let that = this;
    let filteredData = this.state.data.filter(
      function (x) { return Math.abs(parseFloat(x.coef)) >= event.target.value; }
    );
    this.setState({ threshold: event.target.value });
    this.setState({ filteredData: filteredData });
  }

  handleThresholdSubmit(event) {
    event.preventDefault();
  }

  handlePositiveColorPickerButtonClick = () => {
    this.setState({ displayPositiveColorPicker: !this.state.displayPositiveColorPicker });
  }

  handleNegativeColorPickerButtonClick = () => {
    this.setState({ displayNegativeColorPicker: !this.state.displayNegativeColorPicker });
  }

  handlePositiveColorPickerClose = () => {
    this.setState({ displayPositiveColorPicker: false });
  }

  handleNegativeColorPickerClose = () => {
    this.setState({ displayNegativeColorPicker: false });
  }

  handlePositiveColorPickerChange = (color) => {
    this.setState({ positiveCorrelationColor: color.rgb })
    let that = this;
    let filteredData = that.state.filteredData;
    for (let i = 0; i < filteredData.length; i++) {
      let positiveColor = rgbToHex(that.state.positiveCorrelationColor.r, that.state.positiveCorrelationColor.g, that.state.positiveCorrelationColor.b);
      let negativeColor = rgbToHex(that.state.negativeCorrelationColor.r, that.state.negativeCorrelationColor.g, that.state.negativeCorrelationColor.b);
      filteredData[i].linkColor = getColorDichromatic(parseFloat(filteredData[i].coef), positiveColor, negativeColor);
    }
  };

  handleNegativeColorPickerChange = (color) => {
    this.setState({ negativeCorrelationColor: color.rgb })
    let that = this;
    let filteredData = that.state.filteredData;
    for (let i = 0; i < filteredData.length; i++) {
      let positiveColor = rgbToHex(that.state.positiveCorrelationColor.r, that.state.positiveCorrelationColor.g, that.state.positiveCorrelationColor.b);
      let negativeColor = rgbToHex(that.state.negativeCorrelationColor.r, that.state.negativeCorrelationColor.g, that.state.negativeCorrelationColor.b);
      filteredData[i].linkColor = getColorDichromatic(parseFloat(filteredData[i].coef), positiveColor, negativeColor);
    }
  };

  render() {

    const positiveStyles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `rgba(${this.state.positiveCorrelationColor.r}, ${this.state.positiveCorrelationColor.g}, ${this.state.positiveCorrelationColor.b}, ${this.state.positiveCorrelationColor.a})`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    const negativeStyles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `rgba(${this.state.negativeCorrelationColor.r}, ${this.state.negativeCorrelationColor.g}, ${this.state.negativeCorrelationColor.b}, ${this.state.negativeCorrelationColor.a})`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    return (
      <div>

        <form onSubmit={this.handleThresholdSubmit}>
          <label>
            Threshold: <textarea value={this.state.threshold} onChange={this.handleThresholdChange} />
          </label>
          <br />
          <input type="file" onChange={this.onFileChange} />
          <button>Submit</button>
        </form>

        <div>
          <div style={positiveStyles.swatch} onClick={this.handlePositiveColorPickerButtonClick}>
            <div style={positiveStyles.color} />
          </div>
          {this.state.displayPositiveColorPicker ? <div style={positiveStyles.popover}>
            <div style={positiveStyles.cover} onClick={this.handlePositiveColorPickerClose} />
            <SketchPicker color={this.state.positiveCorrelationColor} onChange={this.handlePositiveColorPickerChange} />
          </div> : null}
        </div>

        <div>
          <div style={negativeStyles.swatch} onClick={this.handleNegativeColorPickerButtonClick}>
            <div style={negativeStyles.color} />
          </div>
          {this.state.displayNegativeColorPicker ? <div style={negativeStyles.popover}>
            <div style={negativeStyles.cover} onClick={this.handleNegativeColorPickerClose} />
            <SketchPicker color={this.state.negativeCorrelationColor} onChange={this.handleNegativeColorPickerChange} />
          </div> : null}
        </div>

        <div id="chartdiv" style={{ width: "100%", height: "875px" }}></div>
      </div>
    );
  }
}

function loadCSV(text) {
  let arr = text.split("\n");
  let header = ["variable1", "var1_domain", "variable2", "var2_domain", "coef", "value", "linkColor", "label\r"];
  let data = [];
  for (let i = 1; i < arr.length; i++) {
    let row = {};
    let row_data = arr[i].split(",");
    for (let j = 0; j < header.length; j++)
      row[header[j]] = row_data[j];
    data.push(row);
  }
  return data;
}

function getColorDichromatic(correlation, positiveColor, negativeColor) {
  if (correlation > 0)
    return colorScale(positiveColor, Math.abs(correlation))
  if (correlation < 0)
    return colorScale(negativeColor, Math.abs(correlation))
  return "#D3D3D3"
}
function colorScale(hexstr, scalefactor) {

  if (scalefactor < 0)
    return hexstr;

  let r = parseInt(hexstr.slice(1, 3), 16);
  let g = parseInt(hexstr.slice(3, 5), 16);
  let b = parseInt(hexstr.slice(5, 7), 16);

  r = parseInt(r + (225 - r) * (1 - scalefactor));
  g = parseInt(g + (225 - g) * (1 - scalefactor));
  b = parseInt(b + (225 - b) * (1 - scalefactor));

  return rgbToHex(r, g, b);
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: 1
  } : null;
}

export default App;