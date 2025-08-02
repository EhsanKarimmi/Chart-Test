// src/components/Chart.tsx
import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { type RawChart, isMultiSeries } from "../utils/typeGuards";

type Props = {
  chart: RawChart;
  width?: number;
  height?: number;
};

const COLORS = ["#2563eb", "#16a34a", "#dc2626"]; // آبی، سبز، قرمز به‌عنوان پیش‌فرض
const MARGINS = { top: 30, right: 20, bottom: 30, left: 50 };

export const Chart: React.FC<Props> = ({
  chart,
  width = 700,
  height = 300,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // پاک کردن رندر قبلی
    d3.select(svgRef.current).selectAll("*").remove();

    const innerWidth = width - MARGINS.left - MARGINS.right;
    const innerHeight = height - MARGINS.top - MARGINS.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("role", "img")
      .attr("aria-label", chart.title);

    const container = svg
      .append("g")
      .attr("transform", `translate(${MARGINS.left},${MARGINS.top})`);

    // مقیاس X بر اساس timestamp‌ها
    const timestamps = chart.data.map((d) => d[0]);
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(timestamps) as [number, number])
      .range([0, innerWidth])
      .nice();

    const multi = isMultiSeries(chart);

    // جمع‌آوری همه مقادیر معتبر برای محاسبه دامنه Y
    const allValues: number[] = [];
    if (multi) {
      chart.data.forEach(([, v]) => {
        if (Array.isArray(v)) {
          v.forEach((val) => {
            if (val !== null && val !== undefined) allValues.push(val);
          });
        }
      });
    } else {
      chart.data.forEach(([, v]) => {
        if (typeof v === "number") allValues.push(v);
      });
    }

    const yExtent = d3.extent(allValues);
    const yScale = d3
      .scaleLinear()
      .domain([
        yExtent[0] !== undefined ? yExtent[0] : 0,
        yExtent[1] !== undefined ? yExtent[1] : 1,
      ])
      .nice()
      .range([innerHeight, 0]);

    // محورها
    container
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6).tickSizeOuter(0))
      .call((g) => g.selectAll("text").attr("font-size", 12));

    container
      .append("g")
      .call(d3.axisLeft(yScale).ticks(5).tickSizeOuter(0))
      .call((g) => g.selectAll("text").attr("font-size", 12));

    // خطوط شبکه‌ی پس‌زمینه برای خوانایی
    container
      .append("g")
      .attr("class", "grid")
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => "")
      )
      .selectAll("line")
      .attr("stroke", "#e2e8f0")
      .attr("stroke-opacity", 0.7)
      .attr("stroke-dasharray", "2,2");

    // رندر خطوط
    if (!multi) {
      // single-series: فیلتر کردن null و undefined
      const singleData: [number, number][] = chart.data
        .filter(([, v]) => typeof v === "number")
        .map((d) => [d[0], d[1] as number]);

      const lineGen = d3
        .line<[number, number]>()
        .defined(([, val]) => val !== null && val !== undefined)
        .x((d) => xScale(d[0]))
        .y((d) => yScale(d[1]))
        .curve(d3.curveMonotoneX);

      container
        .append("path")
        .datum(singleData)
        .attr("fill", "none")
        .attr("stroke", COLORS[0])
        .attr("stroke-width", 2.5)
        .attr("d", lineGen as never);

      // نقاط قابل مشاهده
      container
        .selectAll("circle.point")
        .data(singleData)
        .join("circle")
        .attr("class", "point")
        .attr("cx", (d) => xScale(d[0]))
        .attr("cy", (d) => yScale(d[1]))
        .attr("r", 4)
        .attr("fill", COLORS[0])
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    } else {
      // multi-series: تعداد سری‌ها را داینامیک استخراج می‌کنیم
      if (multi) {
        const firstArray = chart.data.find(([, v]) => Array.isArray(v))?.[1] as
          | Array<number | null>
          | undefined;
        const seriesCount = firstArray ? firstArray.length : 0;

        for (let i = 0; i < seriesCount; i++) {
          const seriesData: [number, number][] = chart.data
            .map(([ts, v]) => {
              if (Array.isArray(v)) {
                const val = v[i];
                const y = val == null ? NaN : (val as number);
                return [ts, y] as [number, number];
              }
              return [ts, NaN] as [number, number];
            })
            .filter(([, y]) => !isNaN(y));

          const lineGen = d3
            .line<[number, number]>()
            .defined(([, y]) => !isNaN(y))
            .x((d) => xScale(d[0]))
            .y((d) => yScale(d[1]))
            .curve(d3.curveMonotoneX);

          container
            .append("path")
            .datum(seriesData)
            .attr("fill", "none")
            .attr("stroke", COLORS[i] ?? "#000")
            .attr("stroke-width", 2.5)
            .attr("d", lineGen as never);

          // نقاط سری
          container
            .selectAll(`circle.series-${i}`)
            .data(seriesData)
            .join("circle")
            .attr("class", `series-${i}`)
            .attr("cx", (d) => xScale(d[0]))
            .attr("cy", (d) => yScale(d[1]))
            .attr("r", 3.5)
            .attr("fill", COLORS[i] ?? "#000")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
        }

        // Legend ساده
        const legend = svg
          .append("g")
          .attr("transform", `translate(${MARGINS.left}, 8)`);

        const labels = Array.from(
          { length: seriesCount },
          (_, idx) => `Series ${idx + 1}`
        );
        labels.forEach((label, idx) => {
          const gLegend = legend
            .append("g")
            .attr("transform", `translate(${idx * 120}, 0)`);

          gLegend
            .append("rect")
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", COLORS[idx] ?? "#000")
            .attr("rx", 3);

          gLegend
            .append("text")
            .attr("x", 20)
            .attr("y", 12)
            .attr("font-size", 12)
            .attr("fill", "#374151")
            .text(label);
        });
      }
    }
  }, [chart, width, height]);

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow flex flex-col justify-center items-center  p-5 mb-8">
      <h2 className="text-lg font-semibold mb-2 uppercase">{chart.title}</h2>
      <svg ref={svgRef} className="w-full" />
    </div>
  );
};
