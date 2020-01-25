import React, { Component } from 'react';
import './App.css';
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      threshold: 0.6,
      data:[{"variable1": "varA","var1_domain": "domain3","variable2": "varV","var2_domain": "domain3","coef": "-0.40238348440349847","value": "0.40238348440349847","linkColour": "#c1cc3d", "rounded": "-0.402"},
    {"variable1": "varG","var1_domain": "domain6","variable2": "varI","var2_domain": "domain3","coef": "0.7869249499775308","value": "0.7869249499775308","linkColour": "#3dadcc", "rounded": "0.787"},
    {"variable1": "varU","var1_domain": "domain5","variable2": "varZ","var2_domain": "domain5","coef": "0.5654997321819308","value": "0.5654997321819308","linkColour": "#3dccb1", "rounded": "0.565"},
    {"variable1": "varL","var1_domain": "domain5","variable2": "varN","var2_domain": "domain1","coef": "-0.44449653725230015","value": "0.44449653725230015","linkColour": "#cccb3d", "rounded": "-0.444"},
    {"variable1": "varL","var1_domain": "domain6","variable2": "varF","var2_domain": "domain4","coef": "0.4430148325530492","value": "0.4430148325530492","linkColour": "#3dcc92", "rounded": "0.443"},
    {"variable1": "varW","var1_domain": "domain1","variable2": "varR","var2_domain": "domain5","coef": "0.6158930611854154","value": "0.6158930611854154","linkColour": "#3dccbe", "rounded": "0.616"},
    {"variable1": "varT","var1_domain": "domain7","variable2": "varD","var2_domain": "domain2","coef": "-0.5467308227741515","value": "0.5467308227741515","linkColour": "#ccb13d", "rounded": "-0.547"},
    {"variable1": "varH","var1_domain": "domain7","variable2": "varA","var2_domain": "domain5","coef": "-0.4567911618605825","value": "0.4567911618605825","linkColour": "#ccc83d", "rounded": "-0.457"},
    {"variable1": "varI","var1_domain": "domain8","variable2": "varO","var2_domain": "domain7","coef": "-0.45227245085444834","value": "0.45227245085444834","linkColour": "#ccc93d", "rounded": "-0.452"}    ]};
  }
  
  componentDidUpdate() {
    // Export
    let chart = am4core.create("chartdiv", am4charts.ChordDiagram);
    chart.exporting.menu = new am4core.ExportMenu();
    chart.exporting.filePrefix = "exposome-globe";

    // Colour settings
    chart.colors.saturation = 0.45;

    chart.data = this.state.data;
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
    nodeTemplate.events.on("over", function(event) {    
      var node = event.target;
      node.outgoingDataItems.each(function(dataItem) {
          if(dataItem.toNode){
              dataItem.link.isHover = true;
              dataItem.toNode.label.isHover = true;
          }
      })
      node.incomingDataItems.each(function(dataItem) {
          if(dataItem.fromNode){
              dataItem.link.isHover = true;
              dataItem.fromNode.label.isHover = true;
          }
      }) 
      node.label.isHover = true;   
    })

    // When un-hovering from node, un-hover over links
    nodeTemplate.events.on("out", function(event) {
      var node = event.target;
      node.outgoingDataItems.each(function(dataItem) {        
          if(dataItem.toNode){
              dataItem.link.isHover = false;                
              dataItem.toNode.label.isHover = false;
          }
      })
      node.incomingDataItems.each(function(dataItem) {
          if(dataItem.fromNode){
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
    label.marginTop  = 100;
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
    linkTemplate.propertyFields.fill = "linkColour";
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
      reader.onload = function(event) {
        let unfilteredData = loadCSV(event.target.result);
        let data = unfilteredData.filter(
          function(x) { return Math.abs(parseFloat(x.coef)) >= that.state.threshold; }
        );

        for(let i=0; i<data.length; i++){
          data[i].linkColour = getColourDichromatic(parseFloat(data[i].coef));
          data[i].value = Math.abs(parseFloat(data[i].coef));
          data[i].label = Math.round(parseFloat(data[i].coef) * 1000)/1000;
        }        
        that.setState({data: data});
      };
  };

  render() {
    return (
      <div>
        <input type="file" onChange={this.onFileChange} />
        <div id="chartdiv" style={{ width: "100%", height: "875px" }}></div>
      </div>
    );
  }
}

function loadCSV(text) {
  let arr = text.split("\n");
  let header = arr[0].split(",");
  let data = [];
  for(let i=1; i<arr.length; i++) {
    let row = {};
    let row_data = arr[i].split(",");
    for(let j=0; j<header.length; j++)
      row[header[j]] = row_data[j];
    data.push(row);
  }
  return data;
}

function getColourDichromatic(correlation){
  if(correlation > 0)
        return colorScale("#4F75D2", Math.abs(correlation))
    if(correlation < 0)
        return colorScale("#DF3C3C", Math.abs(correlation))
    return "#D3D3D3"
}

function colorScale(hexstr, scalefactor){

    if (scalefactor < 0)
        return hexstr;

    let r = parseInt(hexstr.slice(1,3), 16);
    let g = parseInt(hexstr.slice(3,5), 16);
    let b = parseInt(hexstr.slice(5,7), 16);

    r = parseInt(r + (225 - r) * (1 - scalefactor));
    g = parseInt(g + (225 - g) * (1 - scalefactor));
    b = parseInt(b + (225 - b) * (1  - scalefactor));

    return rgbToHex(r,g,b);
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


export default App;