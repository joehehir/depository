new Vue({
    el: '#app',
    data: {
        fetchedItems: [],
        renderItems: [],
        renderImages: [],
        isLoading: true,
        selectedItem: undefined,
        apiParams: {
            page: 1,
            perPage: 30,
        },
        subheading: `Browse BrewDog’s <a href="https://www.brewdog.com/lowdown/diydog" target="_blank">DIY Dog</a> catalogue. Kindly powered by <a href="https://punkapi.com/" target="_blank">Punk API</a>.`,
    },
    watch: {
        renderItems() {
            // item array to render is populated
            const urls = this.renderItems.map((obj) => obj.image_url);
            // load images before display
            this.loadImages(urls);
        },
        renderImages() {
            // images loaded
            setTimeout(() => this.isLoading = false, 260);
        },
        selectedItem() {
            if (this.selectedItem) console.log('selected: ', this.selectedItem);
        },
    },
    filters: {
        textContent(value, type) {
            return (value) ? `${type}: ${value}` : null;
        }
    },
    methods: {
        fetchData() {
            const url = `https://api.punkapi.com/v2/beers?page=${this.apiParams.page}&per_page=${this.apiParams.perPage}`;
            fetch(url, { method: 'GET' })
                .then((response) => response.json())
                .then((json) => {
                    this.apiParams.page++;
                    this.processData(json);
                })
                .catch((error) => {
                    this.subheading = `Whoops! Unable to reach Punk API ${String.fromCodePoint(0x1F605)}`;
                    console.error(error);
                });
        },
        processData(data) {
            // store the fetched data
            const maxLength = 360;
            this.fetchedItems = data.map((each) => {
                return Object.entries(each).reduce((obj, [key, value]) => {
                    return { ...obj, [key]: (key === 'description' && value.length > maxLength)
                        ? this.truncateEllipsis(value, maxLength) // trim descriptions
                        : value
                    };
                }, {});
            });
            // render next set
            this.nextSet();
        },
        truncateEllipsis(string, maxLength) {
            const trimmed = string.substring(0, maxLength);
            return `${trimmed.substring(0, trimmed.lastIndexOf('. '))}...`;
        },
        loadImages(urls) {
            const promisedImages = urls.map((url) => {
                return new Promise((resolve, reject) => {
                    const image = new Image();
                    // '.onload' must precede '.src' to resolve previously cached images
                    image.onload = () => resolve(image);
                    image.onerror = (error) => reject(error);
                    image.src = url;
                });
            });
            return Promise.all(promisedImages)
                // update
                .then((resolvedImages) => this.renderImages = resolvedImages)
                .catch((error) => {
                    this.subheading = `Whoops! Image loading has failed ${String.fromCodePoint(0x1F605)}`;
                    console.error(error);
                });
        },
        nextSet() {
            // apply delegate class
            this.isLoading = true;

            // fetch new data if required
            if (this.fetchedItems.length === 0) {
                this.fetchData();

            } else { // use local data
                // sleep for transition duration
                setTimeout(() => {
                    if (this.fetchedItems.length > 9) {
                        this.renderItems = this.fetchedItems.slice(0, 10);
                        this.fetchedItems.splice(0, 10);
                    } else { // incomplete set remaining
                        this.renderItems = this.fetchedItems.slice(0, (this.fetchedItems.length % 10));
                        this.fetchedItems = [];
                    }
                }, 960);
            }
        },
    },
    created() {
        this.fetchData();
    }
});