# -*- coding: utf-8 -*-

# To run the script you will need to create a scrapy project and a spider with this topic_links name type (scrapy crawl topic_links -o **output_file.xml ou json)


import scrapy
import json



#For getting the topics page links you'll need to access the Json structure of the Forum. If you need to get a specific category

class TopicLinksSpider(scrapy.Spider):
    name = 'topic_links'
    domain = 'https://discourse.xxxxxxxx.com'
    # you need to replace the json_link with the correct path. For different forums, you'll need to change de domain.
    # In order to do that, you'll have to inspect the list of topics existing in the community. This is needed to pass through all pages
    json_link = '/c/xxxxxxxx.json?no_definitions=true&order=default&page={}'
    first_page_number = '1'
    api_url = domain + json_link
    start_urls = [api_url.format(first_page_number)]


# This is the scrapy definition for scraping the items. If you need different data you need to find the correct json keys
    def parse(self, response):

        data = json.loads(response.text)
        next_page = data['topic_list']
        title = data['topic_list']['topics'][:]
        #title2 = title['title']

        #for post_link in response.css('td>a'):
        for post_data in data['topic_list']['topics'][:]:
            yield {
                'Title': (post_data['title']).replace(',', '/'),
                #'Title2': title2.replace[',', ';'],
                'Category_id': post_data['category_id'],
                'Slug': post_data['slug'],
                'Replies': post_data['posts_count'],
                'Link': self.domain + '/t/' + post_data['slug'],
            }


        # Goes to next page
        more_topics_url = 'more_topics_url'
        if more_topics_url in next_page:
        #if next_page['more_topics_url']:
            next_page_link = next_page['more_topics_url']
            # Gets the raw link without the page number
            raw_link = (next_page_link.strip('0123456789'))
            # Gets the page number
            page_number_link = (next_page_link.strip(raw_link))

            yield scrapy.Request(url=self.api_url.format(page_number_link), callback=self.parse)

        else:
            print('End of Request')

