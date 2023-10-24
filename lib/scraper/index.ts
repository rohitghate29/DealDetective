import axios from 'axios'
import * as  Cheerio from 'cheerio';
import { extractDescription, extractPrice } from '../utils';

export async function scrapeAmazonProduct(url: string){
    if(!url) return;
    
    
    //BrightData proxy configuration
    const username = String(process.env.BRIGHT_DATA_USERNAME)
    const password = String(process.env.BRIGHT_DATA_PASSWORD)
    const port = 22225
    const session_id = (1000000 * Math.random()) | 0;
    const options = {
        auth: {
            username: `${username}-session-${session_id}`,
            password,
        },
        host: 'brd.superproxy.io',
        port,
        rejectUnauthorized: false,
    }

    try {
        //Fetch the product page
        const response = await axios.get(url, options);
        const $ = Cheerio.load(response.data)

        //Extract the product title
        const title = $(`#productTitle`).text().trim();

        //Extract the product Current Price
        const currentPrice = extractPrice(
            $('.priceToPay span.a-price-whole'),
            $('a.size.base.a-color-price'),
            $('.a-button-selected .a-color-base'),
        );

        //Extract the product Original Price
        const originalPrice = extractPrice(
            $('#priceblock_ourprice'),
            $(".a-price.a-text-price span.a-offscreen"),
            $('#listPrice'),
            $('#priceblock_dealprice'),
            $('.a-size-base.a-color-price')
        )

        //Checking if Product is Out Of Stock Or Not
        const outOfStock = $('#availability span').text().trim().toLowerCase() === 'Currently unavailable'

        //Getting the image of the Product
        const images = $('#imgBlkfront').attr('data-a-dynamic-image') || 
                      $('#landingImage').attr('data-a-dynamic-image') ||
                      '{}'
                      
        //Parsing the Images
        const imageUrls = Object.keys(JSON.parse(images));

        //Getting Currency Symbol
        // const currency = extractCurrency($('.a-price-symbol'))
        //Discount Percent
        const discountRate = $('.savingsPercentage').text().replace(/[-%]/g, "")

        const description = extractDescription($)
        // console.log({title, currentPrice, originalPrice, outOfStock, images, imageUrls, currency, discountRate});
        
        //Construct data object with scrapped information
        const data = {
            url,
            // currency: currency,
            image: imageUrls[0],
            title,
            currentPrice: Number(currentPrice) || Number(originalPrice),
            originalPrice: Number(originalPrice) || Number(currentPrice),
            priceHistory: [],
            discountRate: Number(discountRate),
            category: 'category',
            reviewsCount: 100,
            stars: 4.3,
            isOutOfStock: outOfStock,
            description,
            lowestPrice: Number(currentPrice) || Number(originalPrice),
            highestPrice: Number(originalPrice) || Number(currentPrice),
            averagePrice: Number(currentPrice) || Number(originalPrice),
        }

        return data;
        
    } catch (error:any) {
        throw new Error(`Failed to scrape product: ${error.message}`)
    }
}
