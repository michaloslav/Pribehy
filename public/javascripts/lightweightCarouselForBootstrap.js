export default function createCarousel (id) {
    let carouselActiveItem = 0;
    const carousel = document.getElementById(id);
    if (carousel) {
        const items = [...carousel.querySelectorAll(".carousel-item")];
        const indicators = [...carousel.querySelectorAll(".carousel-indicators li")];
        const prev = carousel.querySelector(".carousel-control-prev");
        const next = carousel.querySelector(".carousel-control-next");
        const switchItem = (id) => {
            const active = id || carouselActiveItem;

            items.forEach((item, i) => {
                item.classList.remove("active");
                indicators[i].classList.remove("active");
            });

            indicators[active].classList.add("active");
            items[active].classList.add("active");
        };

        indicators.forEach(indicator => {
           indicator.addEventListener("click", () => {
              switchItem(indicator.dataset.slideTo);
           });
        });

        prev.addEventListener("click", () => {
            if (carouselActiveItem - 1 < 0) {
                carouselActiveItem = items.length - 1;
            }
            else {
                carouselActiveItem--;
            }

            switchItem();
        });

        next.addEventListener("click", () => {
            if (carouselActiveItem === items.length - 1) {
                carouselActiveItem = 0;
            }
            else {
                carouselActiveItem++;
            }

            switchItem();
        });
    }
}
