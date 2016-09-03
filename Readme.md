# Peekscrape

Peekscrape is a scraper that will watch an HTML page for changes and send an alert to a pushbullet device when a change has been detected. It is designed to be executed periodically using cron or other task scheduler.

## Background
I was inspired to write this app after failing to secure a purchase on a book that has a very limited stock. When the publisher announced a replenishment of the stock, it was sold out again within 90 minutes. I use a task scheduler to execute this app every 25 minutes, When the item comes back into stock, I will be notified when the scheduler next runs the script.

## Method
I'm not interested in the entirety of the page content, so I use a combination of [JSDom](https://github.com/tmpvar/jsdom) and [jQuery](https://jquery.com/) to target a specific HTML element to watch. This has limitations when it comes to pages that are generated using Angular and such, however it currently suits the purpose for most static pages.

The scraped element is stored in [config.json](https://github.com/telekineticyeti/peekscrape/blob/master/config.json) and used as a comparison reference when the script is next executed.

## Configration / Example

You can define the sites to watch in the [config.json](https://github.com/telekineticyeti/peekscrape/blob/master/config.json) file, under the 'targets' tree. Multiple sites can be configured; For each target, a host, path and focus must be specified. If the site is SSL, then 'method'L "https" must also be specified.

``` json
{
	"targets": [
		{
			"method": "https",
			"host": "store.steampowered.com",
			"path": "/",
			"focus": "#tab_topsellers_content .tab_item:first .tab_item_name",
		}
	]
}
```

In the example above, Peekscrape will scrape the [Steam Store](http://store.steampowered.com/) home page and retrieve the name of the video game that is the current #1 Top Seller. If succesfull, the result of the scrape will be saved in a new node called 'snippet'. The snippet is a reference point for comparing with future scrapes.


### Example Output
``` json
{
	"targets": [
		{
			"method": "https",
			"host": "store.steampowered.com",
			"path": "/",
			"focus": "#tab_topsellers_content .tab_item:first .tab_item_name",
			"snippet": "Cities: Skylines",
			"last_checked": "September 3rd 2016, 7:04:23 pm"
		}
	]
}
```

## Pushbullet

Pushbullet credentials can be specified in the 'pushbullet' tree of config.json. Find your pushbullet API key [here](https://www.pushbullet.com/#settings/account).