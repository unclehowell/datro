#You will need to access the json of each user in order to get some of the information. This script is limited to accessing the username,
#the date he joined the community and his last post
# these are usually given by https://forum.XXXXX.zzzzzzz/u/username.json?stats=false
# You will need a output file. Do that by running the scrapy crawl "spider name" -o file.csv

# -*- coding: utf-8 -*-

import scrapy
import csv
from scrapy import Request
import json


class UserJsonSpider(scrapy.Spider):
    name = 'user_json'
    urls_complete = []
    # You will need a file with all usernames links you want to scrap
    file_urls = open("users_json.csv", "r")
    for i in file_urls:
        u = i.split('\n')
        urls_complete.append(u[0])
        print('list of urls ' + i)

    for url in urls_complete:
        print('next urls are' + url)
    main_domain = 'https://forum.xxxx.xxxxx.xxxxx' #replace by the domain of the forum
    start_urls = [urls_complete.pop(0)] #Gets the first url of the file to be scrapped
    next_urls = urls_complete #Shows the remaining urls after removing the first url

    print('start url is' + str(start_urls))

    #print('other url is'+str(other_urls))
    for url in urls_complete:
        print('next url is' + url)

    # Starts the requests for pages

    def parse(self, response):

        jsonloads = json.loads(response.body_as_unicode())

        items = {
                'User': (jsonloads['user']['username']),
                'Joined at': (jsonloads['user']['created_at']),
                'Last posted': (jsonloads['user']['last_posted_at'])
            }

        yield items

        # Goes to next page
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
            # task_urls = str(self.task_urls[0])
            # yield scrapy.Request(url=task_urls, callback=self.parse)
            print(str(next_urls))
            yield scrapy.Request(url=first_page_url, callback=self.parse_end)

        # Gets info about the post

    def parse_end(self, response):

        print('End of Topic Pages')

        if self.next_urls:
            next_urls = [self.next_urls.pop(0)]
            for url in next_urls:
                print('next urls is ' + url)
                yield scrapy.Request(url=url, callback=self.parse)
        else:
            print('end of scraping')


