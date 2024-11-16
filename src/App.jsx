import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

import "./index.css";

const UsMap = () => {
  const [data, setData] = useState([]);
  const [us, setUs] = useState(null);
  const svgRef = useRef();

  useEffect(() => {
    // Fetch data for counties and education levels
    const fetchData = async () => {
      const usResponse = await fetch(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
      );
      const usData = await usResponse.json();
      setUs(usData);

      const educationResponse = await fetch(
        "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
      );
      const educationData = await educationResponse.json();
      setData(educationData);
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data.length || !us) return;

    const color = d3.scaleQuantize([1, 70], d3.schemeGreens[9]); // Adjust color scale
    const path = d3.geoPath();
    const valuemap = new Map(
      data.map((d) => [
        d.fips,
        { area_name: d.area_name, value: d.bachelorsOrHigher, state: d.state },
      ])
    );

    const counties = topojson.feature(us, us.objects.counties).features;
    const states = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

    const svg = d3
      .select(svgRef.current)
      .attr("width", 975)
      .attr("height", 610)
      .attr("viewBox", [0, 0, 975, 610])
      .attr("style", "max-width: 100%; height: auto;");

    // Render counties
    svg
      .append("g")
      .selectAll("path")
      .data(counties)
      .join("path")
      .attr("fill", (d) => {
        const countyData = valuemap.get(d.id);
        return countyData ? color(countyData.value) : "#ccc"; // Default warna jika tidak ada data
      })
      .attr("d", path)
      .append("title")
      .text((d) => {
        const countyData = valuemap.get(d.id);
        return countyData
          ? `${countyData.area_name}, ${countyData.state}: ${countyData.value}%`
          : "Data not available";
      });

    // Render state borders
    svg
      .append("path")
      .datum(states)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("d", path);

    // Render legend
    const legend = svg.append("g").attr("transform", "translate(610,20)");

    // Define custom percentage values for legend
    const legendValues = [3, 12, 21, 30, 39, 48, 57, 66];
    const legendScale = d3
      .scaleLinear()
      .domain([legendValues[0], legendValues[legendValues.length - 1]]) // Min and Max
      .range([0, 240]); // Length of the legend bar

    // Add color blocks for the legend
    legend
      .selectAll("rect")
      .data(d3.pairs(legendValues)) // Pair values for color blocks
      .join("rect")
      .attr("x", (d) => legendScale(d[0]))
      .attr("y", 0)
      .attr("width", (d) => legendScale(d[1]) - legendScale(d[0]))
      .attr("height", 8)
      .attr("fill", (d) => color(d[0])); // Assign color based on value

    // Add axis for the legend scale
    legend
      .append("g")
      .attr("transform", "translate(0,8)")
      .call(
        d3
          .axisBottom(legendScale)
          .tickValues(legendValues) // Use custom percentage values
          .tickFormat((d) => `${d}%`) // Format as percentage
          .tickSize(6)
      )
      .select(".domain")
      .remove();

    // Clean up on rerender
    return () => svg.selectAll("*").remove();
  }, [data, us]);

  return <svg ref={svgRef}></svg>;
};

const App = () => {
  return (
    <main className="flex flex-col justify-center items-center">
      <h1 className="text-5xl font-bold mb-5">
        United States Educational Attainment
      </h1>
      <h2>
        Percentage of adults age 25 and older with a bachelor's degree or higher
        (2010-2014)
      </h2>
      <UsMap />
    </main>
  );
};

export default App;
