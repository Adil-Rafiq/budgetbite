from scrapers.foodpanda_scraper import FoodPandaScraper

LAT = 31.461658;
LNG = 74.364802;
BASE_URL = "https://www.foodpanda.pk";
# BASE_URL = "http://www.foodpanda.pk";


scraper = FoodPandaScraper(BASE_URL, LAT, LNG)
scraper.init()
data = scraper.scrape_all_restaurants()
print(data)
scraper.close()