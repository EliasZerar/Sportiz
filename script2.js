import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function () {
  const marginTop = 90;
  const marginRight = 10;
  const marginBottom = 6;
  const marginLeft = 0;
  const barSize = 48;
  const width = 1000;
  const height = marginTop + barSize * 12 + marginBottom;
  const n = 12;
  const duration = 800;

  const formatNumber = d3.format(",d");
  const formatDate = d3.utcFormat("%Y");

  // Chargement des données
  const data = await d3.csv("./data.csv", d3.autoType);

  function initializeChart() {
    const datevalues = Array.from(
      d3.rollup(data, ([d]) => d.value, (d) => +d.date, (d) => d.name)
    )
      .map(([date, data]) => [new Date(date), data])
      .sort(([a], [b]) => d3.ascending(a, b));

    const names = new Set(data.map((d) => d.name));

    const x = d3.scaleLinear([0, 1], [marginLeft, width - marginRight]);
    const y = d3
      .scaleBand()
      .domain(d3.range(n + 1))
      .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
      .padding(0.1);

const color = (() => {
  const scale = d3.scaleOrdinal(["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#FFD633", "#8D33FF", "#33FFF6", "#FF6F33", "#33FFB5", "#FF3333", "#33A1FF"]); // Palette personnalisée
  const categoryByName = new Map(data.map((d) => [d.name, d.category]));
  scale.domain(categoryByName.values());
  return (d) => scale(categoryByName.get(d.name));
})();

    const keyframes = (() => {
      const keyframes = [];
      for (const [[ka, a], [kb, b]] of d3.pairs(datevalues)) {
        for (let i = 0; i < 5; ++i) {
          const t = i / 5;
          keyframes.push([
            new Date(ka * (1 - t) + kb * t),
            rank((name) =>
              (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t
            ),
          ]);
        }
      }
      keyframes.push([
        new Date(datevalues[datevalues.length - 1][0]),
        rank((name) => datevalues[datevalues.length - 1][1].get(name) || 0),
      ]);
      return keyframes;
    })();

    const nameframes = d3.groups(
      keyframes.flatMap(([, data]) => data),
      (d) => d.name
    );

    const prev = new Map(
      nameframes.flatMap(([, data]) =>
        d3.pairs(data, (a, b) => [b, a])
      )
    );
    const next = new Map(
      nameframes.flatMap(([, data]) =>
        d3.pairs(data)
      )
    );

    function rank(value) {
      const data = Array.from(names, (name) => ({ name, value: value(name) }));
      data.sort((a, b) => d3.descending(a.value, b.value));
      for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
      return data;
    }

    const svg = d3
      .select("#chart-container")
      .append("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .attr("style", "max-width: 100%; height: auto;");
      
      svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", marginTop / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Nombre de licencié en France");

    const updateBars = bars(svg);
    const updateAxis = axis(svg);
    const updateLabels = labels(svg);
    const updateTicker = ticker(svg);

    async function runAnimation() {
      for (const keyframe of keyframes) {
        const transition = svg
          .transition()
          .duration(duration)
          .ease(d3.easeLinear);

        x.domain([0, keyframe[1][0].value]);

        updateAxis(keyframe, transition);
        updateBars(keyframe, transition);
        updateLabels(keyframe, transition);
        updateTicker(keyframe, transition);

        await transition.end();
      }
    }

    function bars(svg) {
      let bar = svg
        .append("g")
        .attr("fill-opacity", 5)
        .selectAll("rect");

      return ([date, data], transition) =>
        (bar = bar
          .data(data.slice(0, n), (d) => d.name)
          .join(
            (enter) =>
              enter
                .append("rect")
                .attr("fill", color)
                .attr("x", x())
                .attr("y", (d) => y((prev.get(d) || d).rank))
                .attr("height", y.bandwidth())
                .attr("width", (d) => x((prev.get(d) || d).value) - x(0)),
            (update) => update,
            (exit) =>
              exit
                .transition(transition)
                .remove()
                .attr("y", (d) => y((next.get(d) || d).rank))
                .attr("width", (d) => x((next.get(d) || d).value) - x(0))
          )
          .call((bar) =>
            bar
              .transition(transition)
              .attr("y", (d) => y(d.rank))
              .attr("width", (d) => x(d.value) - x(0))
          ));
    }

    function labels(svg) {
      let label = svg
        .append("g")
        .style("font", "bold 12px var(--sans-serif)")
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end")
        .selectAll("text");

      return ([date, data], transition) =>
        (label = label
          .data(data.slice(0, n), (d) => d.name)
          .join(
            (enter) =>
              enter
                .append("text")
                .attr(
                  "transform",
                  (d) =>
                    `translate(${x((prev.get(d) || d).value)},${y(
                      (prev.get(d) || d).rank
                    )})`
                )
                .attr("y", y.bandwidth() / 1.5)
                .attr("x", -6)
                .attr("dy", "-0.25em")
                .text((d) => d.name)
                .call((text) =>
                  text
                    .append("tspan")
                    .attr("fill-opacity", 0.7)
                    .attr("font-weight", "normal")
                    .attr("x", -6)
                    .attr("dy", "1.15em")
                ),
            (update) => update,
            (exit) =>
              exit
                .transition(transition)
                .remove()
                .attr("transform", (d) =>
                  `translate(${x((next.get(d) || d).value)},${y(
                    (next.get(d) || d).rank
                  )})`
                )
          )
          .call((label) =>
            label
              .transition(transition)
              .attr("transform", (d) => `translate(${x(d.value)},${y(d.rank)})`)
          ));
    }

    function axis(svg) {
      const g = svg
        .append("g")
        .attr("transform", `translate(0,${marginTop})`);

      const axis = d3
        .axisTop(x)
        .ticks(width / 100)
        .tickSizeOuter(0)

      return (_, transition) => {
        g.transition(transition).call(axis);
        g.select(".tick:first-of-type text").remove();
        g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
        g.select(".domain").remove();
      };
    }

    function ticker(svg) {
      const now = svg
        .append("text")
        .style("font", `bold ${barSize}px var(--sans-serif)`)
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end")
        .attr("x", width - 6)
        .attr("y", marginTop + barSize * (n - 0.45))
        .attr("dy", "0.32em")
        .text(formatDate);

      return ([date], transition) => {
        transition.end().then(() => now.text(formatDate(date)));
      };
    }

    return { svg, runAnimation };
  }

  let { svg, runAnimation } = initializeChart();

  // Initialisation du bouton replay
  d3.select("#replay-button").on("click", () => {
    svg.remove(); // Supprimer l'ancien graphique
    ({ svg, runAnimation } = initializeChart()); // Réinitialiser
    runAnimation(); // Relancer l'animation
  });

  runAnimation();
})();
