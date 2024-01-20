import axios from "axios";
import iziToast from "izitoast";
import "izitoast/dist/css/iziToast.min.css";
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";

const gallery = document.querySelector('.js-gallery');
const input = document.querySelector('.input-string');
const form = document.querySelector('.input-wrap');
const photoLoader = document.getElementById('photo-loader');
const loadMore = document.querySelector('.button-more');
const morePhotoLoader = document.getElementById('more-photo-loader');

let inputValue = '';
const onInput = (e) => { inputValue = e.target.value; };
input.addEventListener('input', onInput);

const lightbox = new SimpleLightbox('.gallery-image-lightbox', {
    captions: true, captionPosition: 'bottom', captionsData: 'alt', close: true, loop: true, enableKeyboard: true, slideSpeed: 400, 
});

const api = axios.create({
    baseURL: 'https://pixabay.com/api/', 
    params: {
        key: '41857217-9df28d1efe56a78287de94859',
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
    }
})

const getPhoto = async (params) => {
    try {
        const response = await api.get('', { params });
        
        return response.data;
    } catch (error) {
        iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
    }
};

const fetchPhotos = (q) => {
    let page = 1; 
    let isLastPage = false;
    const per_page = 40;

    return async () => {
        try {
            const { hits, total } = await getPhoto({ q, page, per_page });
            
            if (total < per_page) {
                iziToast.info({ title: 'Error', message: 'Sorry, there are no images matching your search query. Please try again!' });
                input.value = '';
                photoLoader.classList.remove('loader');
                loadMore.style.display = 'none';
                return;
            } 
            if (isLastPage) return iziToast.info({ message: "We're sorry, but you've reached the end of search results." });


            if (page >= Math.floor(total / per_page)) isLastPage = true;
            page += 1;
            return hits;
        } catch (error) {
            iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
        } 
    }  
}

const renderPhoto = async (uploadPhoto) => {
    const photo = await uploadPhoto();
    const imagePromises = photo.map(img => loadImage(img.webformatURL));

    await Promise.all(imagePromises);
    renderMarkup(photo);
    loadMore.style.display = 'block';

    const firstGalleryItem = gallery.querySelector('.gallery-item');
    if (firstGalleryItem) {
        const cardHeight = firstGalleryItem.getBoundingClientRect().height;

        window.scrollBy({
            top: 2 * cardHeight,
            behavior: 'smooth',
        });
    }
}

let fetchPhotosFunc = null;

const submitPhotos = async (e) => {
    e.preventDefault();
    
    if (fetchPhotosFunc !== null) loadMore.removeEventListener('click', fetchPhotosFunc);
    gallery.innerHTML = '';
    loadMore.style.display = 'none';

    if (inputValue.trim() === '') return iziToast.error({ title: 'Error', message: 'Please, type a search query' });
    
    fetchPhotosFunc = fetchPhotos(inputValue);

    // render photo
    try {
        photoLoader.classList.add('loader');
        await renderPhoto(fetchPhotosFunc);
    } catch (error) {
        iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
    } finally {
        photoLoader.classList.remove('loader');
        morePhotoLoader.classList.remove('loader');
        loadMore.classList.remove('is-hiden');
    }
    // load more
    loadMore.addEventListener('click', async () => {
        try {
            morePhotoLoader.classList.add('loader');
            await renderPhoto(fetchPhotosFunc);
        } catch (error) {
            iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
        }finally {
            photoLoader.classList.remove('loader');
            morePhotoLoader.classList.remove('loader');
            loadMore.classList.remove('is-hiden');
        }
    });

    input.value = '';
    lightbox.refresh();
}
form.addEventListener('submit', submitPhotos);


function renderMarkup (img = []) {
    const marcup = img.reduce((html, {largeImageURL, webformatURL, tags, likes, views, comments, downloads }) => html + `
            <li class="gallery-item">
                <a href="${largeImageURL}" class="gallery-image-lightbox">
                    <img class="gallery-image"
                        src="${webformatURL}"
                        alt="${tags}"
                    />
                </a>
                <div class="photo-info">
                    <p class="item-info"><b>Likes</b><br>${likes}</p>
                    <p class="item-info"><b>Views</b><br>${views}</p>
                    <p class="item-info"><b>Comments</b><br>${comments}</p>
                    <p class="item-info"><b>Dowloads</b><br>${downloads}</p>
                </div>
            </li>`, '');
    gallery.insertAdjacentHTML('beforeend', marcup);
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
    });
}