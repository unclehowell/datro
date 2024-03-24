# Gets data from Discourse based Forum topics from a set o urls links which should be defined in url.csv (one link per line). 
# Please, note that in order to make this spider to run, you will have to configure it manually to associate it to your scrapy project.
# You can also start a scrapy project, create a spider with the name of this spider and copy/paste this script to your spider script.


import scrapy
import csv
from scrapy import Request


class CommentSpider(scrapy.Spider):
    name = "topic_spider"
    
    #allowed_domains = ('https://forum.openag.media.mit.edu') ###This is not used in this script
    urls_complete = []
    file_urls = open("urls.csv", "r") # You will need a csv file with all the topic pages you want to scrap. End of the file should have a ending statement "End of pages".
    for i in file_urls:
        u = i.split('\n')
        urls_complete.append(u[0])
        print('list of urls ' + i)

    for url in urls_complete:
        print('next urls are' + url)
    main_domain = 'https://forum.openag.media.mit.edu' #add your
    start_urls = [urls_complete.pop(0)] #Gets the first url of the file to be scrapped
    next_urls = urls_complete #Shows the remaining urls after removing the first url

    print('urls complete is' + str(urls_complete))
    print('start url is' + str(start_urls))
    #print('other url is'+str(other_urls))
    for url in urls_complete:
        print('next url is' + url)

    # Starts the requests for pages
    def start_request(self):

        start_urls = [self.urls_complete.pop(0)]
        print('start_request'+str(start_urls))
        yield Request(start_urls, self.parse)

    # Gets info of the responses including (author, text, mentions, time)
    def parse(self, response):

        for url in self.urls_complete:

            link_total = response.css('h1 a::attr(href)').extract_first(),
            file_type = ".csv",
            title_name = str(response.css('title::text').extract_first()) + ''.join(file_type),
            file_name = '-'.join(title_name).replace('"', '').replace(',', '-').replace('$', "_")
            urls_link = url
            topic_creator = response.css('span a span::text').extract_first()

        for comment in response.css('div.topic-body'):
            #author = comment.css('div span a span::text').extract_first(),
            full_text = ''.join(comment.css('div.post p::text').extract()),
            joined_text = [text.replace('\n', ' ') for text in full_text],
            #final_text = {}
            #title = str(response.css('title::text').extract_first())

            items = {
                'topic_creator': topic_creator,
                'user_comment': comment.css('div span a span::text').extract_first(),
                'author_id': comment.css('div article::attr(data-user-id'),
                'text': [text.replace('\n', ' ')for text in comment.css('div.post p::text').extract()],
                'mentions': comment.css('div.post p a::text').extract_first(),
                'time_1': comment.css('span meta::attr(content)').extract_first(),
                'time_2': comment.css('span time::attr(datetime)').extract_first(),
                'title': str(response.css('title::text').extract_first()),
            }

            yield items

        # Performs the scrapping process for next topic page
        first_page_url = response.css('h1 a::attr(href)').extract_first()
        next_page_url = response.css('link[rel=next]::attr(href)').extract_first()
        next_urls = self.next_urls

        if next_page_url is not None:
            next_page_url = response.urljoin(next_page_url)
            yield scrapy.Request(url=next_page_url, callback=self.parse)

        else:
            file_type = ".csv",
            title_name = str(response.css('title::text').extract_first()) + ''.join(file_type),
            file_name = '-'.join(title_name)
            first_page_url = response.urljoin(first_page_url)
            #task_urls = str(self.task_urls[0])
            #yield scrapy.Request(url=task_urls, callback=self.parse)
            print(str(next_urls))
            yield scrapy.Request(url=first_page_url, callback=self.parse_end)



    # Gets info about the post
    def parse_end(self, response):


        file_type = ".csv",
        title_name = str(response.css('title::text').extract_first())+''.join(file_type),

        results = {
            'Title': response.css('title::text').extract_first(),
            'Link': response.url,
            'Category': response.css('div div span::text').extract_first(),
            'Topic_Author': response.css('div span a span::text').extract_first(),
        }

        yield results
        print('End of Topic Pages')

        if self.next_urls:
            next_urls = [self.next_urls.pop(0)]
            for url in next_urls:
                    print('next urls is ' + url)
                    yield scrapy.Request(url=url, callback=self.parse)
        else:
            print('end of scraping')








