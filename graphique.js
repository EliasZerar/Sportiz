import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function () {
  const marginTop = 90;
  const marginRight = 110;
  const marginBottom = 15;
  const marginLeft = 0;
  const barSize = 48;
  const width = 1000;
  const height = marginTop + barSize * 12 + marginBottom;
  const n = 12;
  const duration = 800;
  let animation;
  let isRunning = false;
  let currentFrameIndex = 0;

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

    const x = d3.scaleLinear([0, 0.6], [marginLeft, width - marginRight]);

    const y = d3
      .scaleBand()
      .domain(d3.range(n + 1))
      .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
      .padding(0.1);

    const color = (() => {
      const scale = d3.scaleOrdinal([
        "#5A5A5A", "#A3A3A3", "#A3A3A3", "#A3A3A3", "#A3A3A3",
        "#A3A3A3", "#A3A3A3", "#A3A3A3", "#A3A3A3", "#A3A3A3",
        "#A3A3A3"
      ]);
      const categoryByName = new Map(data.map((d) => [d.name, d.category]));
      scale.domain(categoryByName.values());
      return (d) => scale(categoryByName.get(d.name));
    })();
    startAnimation()

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
    const slider = d3.select("#timeline-slider")
    .attr("max", keyframes.length - 1)
    .attr("min", 0)
    .attr("step", 1)
    .on("input", function() {
        const frameIndex = +this.value;
        currentFrameIndex = frameIndex;
        stopAnimation();
        updateChart(keyframes[frameIndex]);
    });

    function updateSliderPosition(index) {
      slider
          .transition()  // Transition fluide du slider
          .duration(duration)  // Correspond au temps de chaque frame (600ms)
          .ease(d3.easeLinear)
          .tween("value", () => {
              const interpolate = d3.interpolateNumber(+slider.property("value"), index);
              return (t) => {
                  slider.property("value", interpolate(t));  // Met à jour la position du slider en douceur
              };
          });
    }
    

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
      .attr("fill", "white")
      .style("font-size", "24px")
      .style("font-weight", "bold")
      .text("Nombre de licenciés en France");

    const updateBars = bars(svg);
    const updateAxis = axis(svg);
    const updateLabels = labels(svg);
    const updateTicker = ticker(svg);



    function updateChart([date, data]) {
      if (!isRunning) {
        // Mise à jour immédiate sans attendre une transition coûteuse
        x.domain([0, data[0].value]);
        updateAxis([date, data]);
        updateBars([date, data]);
        updateLabels([date, data]);
        updateTicker([date]);
        slider.property("value", currentFrameIndex);
      } else {
        // Transition normale pour l'animation automatique
        const transition = d3.transition().duration(600).ease(d3.easeLinear);
        updateAxis([date, data], transition);
        updateBars([date, data], transition);
        updateLabels([date, data], transition);
        updateTicker([date], transition);
      }
    }
    
    async function runAnimation(startIndex = 0) {
      let i = startIndex;
      while (isRunning && i < keyframes.length) {
          updateSliderPosition(i);  // Mise à jour fluide du slider
          const keyframe = keyframes[i];
          const transition = svg.transition()
              .duration(duration)  // Garder la même durée que le slider
              .ease(d3.easeLinear);  // Transition linéaire pour uniformité
    
          x.domain([0, keyframe[1][0].value]);
          updateAxis(keyframe, transition);
          updateBars(keyframe, transition);
          updateLabels(keyframe, transition);
          updateTicker(keyframe, transition);
    
          await transition.end();  // Attendre la fin de la transition
    
          if (!isRunning) break;
          i = (i + 1) % keyframes.length;
          currentFrameIndex = i;
      }
    }    
  
  
  

  function startAnimation() {
    if (isRunning) return;
    isRunning = true;
    runAnimation(currentFrameIndex);
}

function stopAnimation() {
    isRunning = false;
}


function replayAnimation() {
    stopAnimation();
    currentFrameIndex = 0; // Réinitialise l'index à la première frame
    startAnimation();
}

function bars(svg) {
  let bar = svg
      .append("g")
      .attr("fill-opacity", 0.7)
      .selectAll("rect");
      

  return ([date, data], transition) => {
      bar = bar
          .data(data.slice(0, n), (d) => d.name)
          .join(
              (enter) =>
                  enter
                      .append("rect")
                      .attr("fill", color)
                      .attr("x", x(0)) // Initialisation correcte à gauche
                      .attr("y", (d) => y((prev.get(d) || d).rank))
                      .attr("height", y.bandwidth())
                      .attr("width", 0) // Barres démarrent à 0 largeur
                      .attr ("id", (d) => d.name)
                      
                      .call((enter) =>
                          enter
                              .transition(transition)
                              .attr("width", (d) => x(d.value) - x(0))
                      ),
              (update) =>
                  update.call((update) =>
                      update
                          .transition(transition)
                          .attr("y", (d) => y(d.rank))
                          .attr("width", (d) => x(d.value) - x(0))
                  ),
              (exit) =>
                  exit
                      .transition(transition)
                      .attr("width", 0)
                      .attr("y", (d) => y((next.get(d) || d).rank))
                      .remove()
          );
  };
}

    function labels(svg) {
      let label = svg
        .append("g")
        .style("font", "bold 12px var(--sans-serif)")
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "start")
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
                .attr("y", y.bandwidth() / 2)
                .attr("x", 6)
                .text((d) => d.name)
                .attr("fill", "white")
                .call((text) =>
                  text
                    .append("tspan")
                    .attr("x", 6)
                    .attr("dy", "1.2em")
                    .attr("font-weight", "normal")
                    .attr("fill", "white")
                    .text((d) => formatNumber(d.value))
                ),
            (update) =>
              update.call((update) =>
                update
                  .transition(transition)
                  .attr("transform", (d) => `translate(${x(d.value)},${y(d.rank)})`)
                  .select("tspan")
                  .tween("text", function (d) {
                    const i = d3.interpolateNumber(
                      this.textContent.replace(/,/g, ""),
                      d.value
                    );
                    return function (t) {
                      this.textContent = formatNumber(i(t));
                    };
                  })
              ),
            (exit) =>
              exit
                .transition(transition)
                .remove()
                .attr("transform", (d) =>
                  `translate(${x((next.get(d) || d).value)},${y(
                    (next.get(d) || d).rank
                  )})`
                )
          ));
    }

    function axis(svg) {
      const g = svg
        .append("g")
        .attr("transform", `translate(0,${marginTop})`);

        const axis = d3.axisTop(x).ticks(width / 150).tickSizeOuter(0);


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
        .style("fill", "white")
        .attr("text-anchor", "end")
        .attr("x", width - 6)
        .attr("y", marginTop + barSize * (n - 0.45))
        .attr("dy", "0.32em")
        .text(formatDate(keyframes[0][0])); // Affiche la première date au départ
    
      return ([date], transition) => {
        transition.end().then(() => now.text(formatDate(date))); // Met à jour la date sur le ticker
      };
    }
    

    runAnimation();

  function stopAnimation() {
      isRunning = false;
  }
  
  // Bouton pause/marche combiné
  function togglePausePlay() {
      if (isRunning) {
          stopAnimation();
          d3.select("#start-button").text("Marche");
      } else {
          startAnimation();
          d3.select("#start-button").text("Pause");
      }
  }
  
  // Ajouter les événements aux boutons
  d3.select("#start-button").on("click", togglePausePlay);
  d3.select("#replay-button").on("click", replayAnimation);
 
  svg.selectAll("rect").on("click", function (event, d) {
    const sectionId = d.name.toLowerCase(); // Le nom de la barre doit correspondre à l'ID de la section
    const targetSection = document.getElementById(sectionId);
  
    // Masquer toutes les sections avant d'afficher la section cible
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
    });
  
    if (targetSection) {
      targetSection.classList.add('active'); // Affiche la section correspondante
      location.replace(`#${sectionId}`);     // Redirige vers la section
    } else {
      console.warn(`Section #${sectionId} introuvable.`);
    }
  });
  

  }

  initializeChart();
})();
