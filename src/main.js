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
const handleInput = (e) => { inputValue = e.target.value; };
input.addEventListener('input', handleInput);

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

const getPhotos = async (params) => {
    try {
        const response = await api.get('', { params });
        
        return response.data;
    } catch (error) {
        iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
    }
};

const initializePhotoFetching = (q) => {
    const state = {
        page: 1,
        isLastPage: false,
        per_page: 40,
    };

    return async () => {
        try {
            const { hits, total } = await getPhotos({ q, page: state.page, per_page: state.per_page });
            

            if (total === 0) {
                iziToast.info({ title: 'Error', message: 'Sorry, there are no images matching your search query. Please try again!' });
                input.value = '';
                photoLoader.classList.remove('loader');
                loadMore.classList.add('is-hidden');
                return;
            }

            state.isLastPage = state.page >= Math.ceil(total / state.per_page);
            state.page += 1;

            if (state.isLastPage) {
                iziToast.info({ message: "We're sorry, but you've reached the end of search results." });
                loadMore.style.display = 'none';
                loadMore.removeEventListener('click', morePhotoLoadClick);
            } else {
                loadMore.style.display = 'block';
            }

            return hits;
        } catch (error) {
            iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
        }
    };
};

const renderPhoto = async (uploadPhoto) => {
    const photo = await uploadPhoto();
    const imagePromises = photo.map(img => loadImage(img.webformatURL));

    await Promise.all(imagePromises);
    
    renderMarkup(photo);

    const firstGalleryItem = gallery.querySelector('.gallery-item');
    if (firstGalleryItem) {
        const cardHeight = firstGalleryItem.getBoundingClientRect().height;

        window.scrollBy({
            top: 2 * cardHeight,
            behavior: 'smooth',
        });
    }
    
};

let fetchPhotosFunc = null;

const submitPhotosForm = async (e) => {
    e.preventDefault();

    if (fetchPhotosFunc !== null) {
        loadMore.removeEventListener('click', morePhotoLoadClick);
        fetchPhotosFunc = null;
    }

    gallery.innerHTML = '';
    loadMore.style.display = 'none';

    if (inputValue.trim() === '') {
        iziToast.error({ title: 'Error', message: 'Please, type a search query' })
        return
    }

    const newFetchPhotosFunc = initializePhotoFetching(inputValue);
    fetchPhotosFunc = newFetchPhotosFunc;

    // render photo
    try {
        photoLoader.classList.add('loader');
        await renderPhoto(fetchPhotosFunc);
    } catch (error) {
        iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
    } finally {
        photoLoader.classList.remove('loader');
        morePhotoLoader.classList.remove('loader');
        loadMore.classList.remove('is-hidden');

        loadMore.addEventListener('click', morePhotoLoadClick);
        
    }
    // load more
    loadMore.addEventListener('click', morePhotoLoadClick);

    input.value = '';
    lightbox.refresh();
};
loadMore.classList.add('is-hidden');
form.addEventListener('submit', submitPhotosForm);

async function morePhotoLoadClick() {
    try {
        morePhotoLoader.classList.add('loader');
        await renderPhoto(fetchPhotosFunc);
    } catch (error) {
        iziToast.error({ title: 'Error', message: 'Error fetching or processing photos' });
    } finally {
        photoLoader.classList.remove('loader');
        morePhotoLoader.classList.remove('loader');
        loadMore.classList.remove('is-hidden');
    }
    if (fetchPhotosFunc && fetchPhotosFunc.isLastPage) {
            console.log('Reached before hiding button'); 
            loadMore.classList.add('is-hidden');
        } else {
            loadMore.classList.remove('is-hidden');
        }
}


function renderMarkup (img = []) {
    const markup = img.reduce((html, {largeImageURL, webformatURL, tags, likes, views, comments, downloads }) => html + `
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
    gallery.insertAdjacentHTML('beforeend', markup);
};

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
    });
};