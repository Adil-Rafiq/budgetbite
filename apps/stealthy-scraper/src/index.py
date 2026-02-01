from playwright.sync_api import sync_playwright
from seleniumbase import sb_cdp

sb = sb_cdp.Chrome()
endpoint_url = sb.get_endpoint_url()

with sync_playwright() as pw:
    browser = pw.chromium.connect_over_cdp(endpoint_url)
    context = browser.contexts[0]
    page = context.pages[0]

    page.goto("https://www.foodpanda.pk/restaurant/s9vx/ny-212-dha")

    sb.sleep(3)
    page.screenshot(path="example.png")
    sb.sleep(3)
