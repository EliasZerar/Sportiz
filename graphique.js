import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(async function () {
  const marginTop = 90;
  const marginRight = 100;
  const marginBottom = 15;
  const marginLeft = 3;
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
      .rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.15)])
      .padding(0.15);

      const color = (() => {
        // Définition d'une couleur unique (par exemple, 'steelblue')
        const singleColor = d3.color("#CACACA");
        singleColor.opacity = 0.6;
        
        // Retourne une fonction qui renvoie toujours la même couleur
        return () => singleColor;
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
    .attr("step", 0.01)
     .on("input", function() {
        const frameIndex = +this.value;
        currentFrameIndex = frameIndex;
        stopAnimation();
        updateChart(keyframes[frameIndex]);
    });

    function updateSliderPosition(index) {
      const maxFrames = keyframes.length - 1; 
      slider
          .transition()
          .duration(duration)
          .ease(d3.easeLinear)
          .tween("value", () => {
              const interpolate = d3.interpolateNumber(+slider.property("value"), index);
              return (t) => {
                  const value = interpolate(t);
                  slider.property("value", value);
                  slider.style("--value", `${(value / maxFrames) * 100}%`);
                  
                  // Forcer le reflow dans Chrome
                  slider.offsetWidth; // Lecture du layout
              };
          });
  }
  
   slider.on("input", function () {
    const frameIndex = Math.round(+this.value);
    currentFrameIndex = frameIndex;
    stopAnimation(); // Arrête l'animation
    d3.select("#start-button img").attr("src", "boutonplay.svg");

    // Mise à jour graphique et ticker
    updateChart(keyframes[frameIndex]);
    updateTicker(keyframes[frameIndex]);

    // Mise à jour de la barre orange
    const maxFrames = keyframes.length - 1;
    const progress = (frameIndex / maxFrames) * 100;
    slider.style("--value", `${progress}%`);

    // Forcer Chrome à recalculer les styles
    slider.offsetHeight; // Relecture du layout
});

  

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
      .attr("y", marginTop / 3)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "1.5em")
      .style("font-weight", "bold")
      .style("font-family", "HelveticaNeue, sans-serif")
      .text("SPORTS LES PLUS PRATIQUÉS PAR LES FRANÇAIS ENTRE 2016 ET 2023");

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
              .duration(duration) 
              .ease(d3.easeLinear);
          
          x.domain([0, keyframe[1][0].value]);
          updateAxis(keyframe, transition);
          updateBars(keyframe, transition);
          updateLabels(keyframe, transition);
          updateTicker(keyframe, transition);
          
          await transition.end();
          
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

const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');

function hideImage() {
  previewContainer.style.display = 'none';
}

function showImage(src, event) {
  previewImage.src = src; // Définit la source de l'image
  previewContainer.style.display = 'block'; // Affiche le conteneur de l'image
  const offsetX = 20; // Décalage horizontal (par rapport à la souris)
  const offsetY = 20; // Décalage vertical (par rapport à la souris)
  previewContainer.style.left = event.pageX + offsetX + 'px'; // Utiliser pageX pour inclure le défilement
  previewContainer.style.top = event.pageY + offsetY + 'px'; // Utiliser pageY pour inclure le défilement
}

function updateImagePosition(event) {
  const offsetX = 12; // Décalage horizontal
  const offsetY = 15; // Décalage vertical
  previewContainer.style.left = event.pageX + offsetX + 'px'; // Mise à jour de la position horizontale
  previewContainer.style.top = event.pageY + offsetY + 'px'; // Mise à jour de la position verticale
}

const hoverColorScale = d3.scaleOrdinal()
  .domain([...names]) // Les noms uniques des barres
  .range
  (["#A09B5B", //foot
    "#852D2D", //tennis
    "#6F4B38", //equitation
    "#533C80", //basket
    "#AA6D4C", //hand
    "#324894", //judo
    "#9C3535", //golf
    "#394B77", //natation
    "#9C3535", //rugby
    "#A56B81", //gym
    "#4E876A"]); //athle

function bars(svg) {
  svg.append("defs")
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("x", marginLeft) // Début du clip correspondant à la marge gauche
  .attr("y", 0)
  .attr("width", width - marginLeft) // Largeur limitée à la zone visible
  .attr("height", height);

  let bar = svg
    .append("g")
    .attr("clip-path", "url(#clip)")
    .selectAll("path");

  return ([date, data], transition) => {
    bar = bar
      .data(data.slice(0, n), (d) => d.name)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("d", (d) => {
              // Barres avec largeur initiale 0 pour animation
              const radius = 5;
              const x = d3.scaleLinear([0, 0.6], [marginLeft, width - marginRight]);
              const x0 = x(0) + marginLeft;
              const x1 = x(0) + marginLeft;
              const y0 = y(d.rank);
              const height = y.bandwidth();

              return `
                M${x0},${y0} 
                h${x1 - x0} 
                v${height} 
                h${x1 + x0} 
                Z
              `;
            })
            .attr("fill", color)
            .attr("id", (d) => d.name)
            .on("mouseover", function (event, d) {
              // Change la couleur au survol
              d3.select(this).attr("fill", hoverColorScale(d.name))
              .style("cursor", "pointer");
              const idBar = d3
                .select(this)
                .attr("id")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
              const imgSrc = "media/" + idBar + ".png";
              showImage(imgSrc, event);
            })
            .on("mouseout", function (event, d) {
              // Restaure la couleur initiale
              d3.select(this).attr("fill", color(d));
              hideImage();
            })
            .on("mousemove", updateImagePosition)
            .on("click", function (event, d) {
              const sectionId = normalizeString(d.name);
              const targetSection = document.getElementById(sectionId);

              // Masquer toutes les sections avant d'afficher la section cible
              document.querySelectorAll(".section").forEach((section) => {
                section.classList.remove("active");
              });

              if (targetSection) {
                targetSection.classList.add("active"); // Affiche la section correspondante
                location.replace(`#${sectionId}`); // Redirige vers la section
              } else {
                console.warn(`Section #${sectionId} introuvable.`);
              }
            })
            .call((enter) =>
              enter
                .transition(transition) // Animation d'apparition
                .duration(800)
                .ease(d3.easeLinear)
                .attr("d", (d) => {
                  // Chemin final avec la largeur correcte
                  const radius = 5;
                  const x0 = marginLeft;
                  const x1 = x(d.value);
                  const y0 = y(d.rank);
                  const height = y.bandwidth();

                  return `
                    M${x0},${y0} 
                    h${x1 - x0 - radius} 
                    a${radius},${radius} 0 0 1 ${radius},${radius} 
                    v${height - 2 * radius} 
                    a${radius},${radius} 0 0 1 -${radius},${radius} 
                    h${-x1 + x0 + radius} 
                    Z
                  `;
                })
            ),
        (update) =>
          update.call((update) =>
            update
              .transition(transition)
              .attr("d", (d) => {
                const radius = 5;
                const x0 = x(0);
                const x1 = x(d.value);
                const y0 = y(d.rank);
                const height = y.bandwidth();

                return `
                  M${x0},${y0} 
                  h${x1 - x0 - radius} 
                  a${radius},${radius} 0 0 1 ${radius},${radius} 
                  v${height - 2 * radius} 
                  a${radius},${radius} 0 0 1 -${radius},${radius} 
                  h${-x1 + x0 + radius} 
                  Z
                `;
              })
          ),
        (exit) =>
          exit
            .transition(transition)
            .attr("d", (d) => {
              // Barres disparaissent vers largeur 0
              const x0 = x(0);
              const x1 = x(0) + marginLeft;
              const y0 = y(d.rank);
              const height = y.bandwidth();

              return `
                M${x0},${y0} 
                h${x1 - x0} 
                v${height} 
                h${-x1 + x0} 
                Z
              `;
            })
            .remove()
      );
  };
}

    function labels(svg) {
      let label = svg
        .append("g")
        .style("font-family", "HelveticaNeue, sans-serif")
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
                    .attr("font-weight", "light")
                    .attr("fill", "lightgrey")
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

      const tickLength = -barSize * 11;
      const g = svg

        .append("g")
        .attr("transform", `translate(0,${marginTop})`);
    
      const axis = d3
        .axisTop(x)
        .ticks(width / 160) // Adaptez le nombre de ticks si nécessaire
        .tickSize(tickLength) // Longueur des ticks vers le haut (-10 pixels)
        .tickSizeOuter(0) // Pas de tick à l'extrémité de l'axe
    
      return (_, transition) => {
        g.transition(transition).call(axis);
        g.selectAll("text")
          .attr("fill", "grey")
          .style("font-family", "HelveticaNeue, sans-serif");
        g.selectAll(".tick line") // Sélection de tous les éléments de ligne de tick pour modifier leur style
          .attr("stroke", "grey") // Couleur des ticks
          .attr("stroke-width", 0.5); // Épaisseur des ticks
        g.select(".domain").remove(); // Enlève la ligne de domaine de l'axe
      };
    }    

    function ticker(svg) {
      const now = svg
        .append("text")
        .attr("style", "fill: white") // Couleur dorée
        .style("font-size", "35px")
        .style("font-weight", "bold")
        .style("font-family", "HelveticaNeue, sans-serif")
        .style("font-variant-numeric", "tabular-nums")
        .attr("text-anchor", "end") // Aligné à droite
        .attr("x", width - 30) // Position horizontale (dans le graphique)
        .attr("y", height - 50) // Position verticale (dans le graphique)
        .attr("dy", "-0.32em") // Ajuste la ligne de base pour un meilleur alignement
        .text(formatDate(keyframes[0][0]));
    
      return ([date], transition = null) => {
        if (transition) {
          transition.end().then(() => now.text(formatDate(date)));
        } else {
          now.text(formatDate(date)); // Mise à jour immédiate sans transition
        }
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
      
      d3.select("#start-button img")
        .attr("src", "boutonplay.svg")  
       
    } else {
      
      isRunning = true;
      runAnimation(currentFrameIndex);
      
      d3.select("#start-button img")
        .attr("src", "boutonpause.svg")  // L'image du bouton 'pause'
      
    }
  }

  
  // Ajouter les événements aux boutons
  d3.select("#start-button").on("click", togglePausePlay);  
// Fonction pour normaliser les chaînes avec accents
function normalizeString(str) {
  return str
    .normalize("NFD") // Sépare les lettres des accents
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .toLowerCase() // Convertit en minuscules
    .replace(/[^a-z0-9]/g, ""); // Supprime les caractères spéciaux
}

svg.selectAll("path").on("click", function (event, d) {
  const sectionId = normalizeString(d.name); // Utilisation de la fonction de normalisation
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