Introduction
=================================

The **open H**\ ome **A**\ utomation **B**\ us (openHAB) is an open source, technology agnostic home automation
platform which runs as the center of your smart home!

.. container::

Some of openHAB’s strengths are:

-  Its ability to integrate a multitude of other devices and systems.
   openHAB includes other home automation systems, (smart) devices and
   other technologies into a single solution
-  To provide a uniform user interface and a common approach to
   automation rules across the entire system, regardless of the number
   of manufacturers and sub-systems involved
-  Giving you the most flexible tool available to make almost any home
   automation wish come true; if you can think it, odds are that you can
   implement it with openHAB.

What You Need to Know Before You Start
--------------------------------------

**When home automation just seems to work, it is always the result of
hard work.** Home automation is fascinating and requires a considerable
investment of your time. Here are some key considerations especially for
new users. To be successful, you will need to:

-  Start slowly and one step at a time
-  Be prepared to learn
-  Remain flexible in how you want to achieve your goal
-  Celebrate all the small successes

Remember, openHAB is just a computer program. The computer will only do
what *you* tell it to do. openHAB can provide many default solutions
that are easy to setup. On the flip side, the more you insist that
everything should look and work exactly the way you want it, the more
work you will have to invest. openHAB is fully customizable, but doing
so will require substantial effort on your part.

After you have read the documentation for openHAB, you will have:

-  Identified a computer on which to run openHAB
-  Learned how to install openHAB, as well as all other software that is
   needed to run openHAB (e.g., JAVA)
-  Learned how your smart devices communicate with openHAB; how to make
   openHAB give commands to your smart devices; and how you can interact
   with openHAB

Keep your focus. For almost everything, there is more than one way in
openHAB to achieve a goal or perform a task. Initially, this can be
frustrating and confusing, but it also gives great flexibility and does
not mandate the use of certain devices or tools.

You may need to learn more about computers than you currently do. But
this may not be a problem as you are reading the documentation of
software that will enable you to do home automation yourself.

Lastly, be prepared to start a new hobby: home automation.

Basic functions can be achieved in openHAB rather quickly, e.g., switch
lights on at a certain time. Others will require much more effort and
thought, e.g., how do I determine that someone is home, including
guests, but not counting pets? The openHAB forum is a great place to
learn and discuss.

A Quick Overview
----------------

openHAB communicates electronically with smart and not-so-smart devices,
performs user-defined actions and provides web-pages with user-defined
information as well as user-defined tools to interact with all devices.
To achieve this, openHAB segments and compartmentalizes certain
functions and operations. The following table gives a top-level
description of the most important concepts as well as a link to more
information:

+-----------------------+-----------------------+-----------------------+
| Concepts              | Meaning               | More Information      |
+=======================+=======================+=======================+
| Bindings              | are the openHAB       | *see below*           |
|                       | component that        |                       |
|                       | provides the          |                       |
|                       | interface to interact |                       |
|                       | electronically with   |                       |
|                       | devices               |                       |
+-----------------------+-----------------------+-----------------------+
| Things                | are the first openHAB | `click for more info  |
|                       | (software) generated  | on                    |
|                       | representation of     | Things                |
|                       | your devices          | <%7B%7Bbase%7D%7D/con |
|                       |                       | cepts/things.html>`__ |
+-----------------------+-----------------------+-----------------------+
| Channels              | are the openHAB       | *see below*           |
|                       | (software) connection |                       |
|                       | between “Things” and  |                       |
|                       | “Items” (see below)   |                       |
+-----------------------+-----------------------+-----------------------+
| Items                 | are the openHAB       | `click for more info  |
|                       | (software) generated  | on                    |
|                       | representation of     | Items                 |
|                       | information about the |  <%7B%7Bbase%7D%7D/co |
|                       | devices               | ncepts/items.html>`__ |
+-----------------------+-----------------------+-----------------------+
| Rules                 | that perform          | `click for more info  |
|                       | automatic actions (in | on                    |
|                       | its simplest form: if | Rules <%7B%7Bb        |
|                       | “this” happens,       | ase%7D%7D/configurati |
|                       | openHAB will do       | on/rules-dsl.html>`__ |
|                       | “that”)               |                       |
+-----------------------+-----------------------+-----------------------+
| Sitemap               | is the openHAB        | `click for more info  |
|                       | (software) generated  | on                    |
|                       | user interface (web   | Sitemaps <%7B%7B      |
|                       | site) that presents   | base%7D%7D/configurat |
|                       | information and       | ion/sitemaps.html>`__ |
|                       | allows for            |                       |
|                       | interactions          |                       |
+-----------------------+-----------------------+-----------------------+

While the table above gives an overview, please remember that it is
incomplete and a simplification of openHAB for the sake of this
overview. More elements will be introduced in later chapters of the
documentation. All the above
`Concepts <%7B%7Bbase%7D%7D/concepts/index.html>`__ are explained in
more depth on other pages that can be accessed either through the
sidebar or the links in the table above.

Channels
~~~~~~~~

Channels are the logical link between a
`Thing <%7B%7Bbase%7D%7D/concepts/things.html>`__ and an
`Item <%7B%7Bbase%7D%7D/concepts/items.html>`__. Channels originate from
`Things <%7B%7Bbase%7D%7D/concepts/things.html>`__ definition and define
how your `Thing <%7B%7Bbase%7D%7D/concepts/things.html>`__ can
communicate with `Item <%7B%7Bbase%7D%7D/concepts/items.html>`__ (and
vice versa). You will create channels when defining your
`Thing <%7B%7Bbase%7D%7D/concepts/things.html>`__.

During the definition of your
`Thing <%7B%7Bbase%7D%7D/concepts/things>`__ you will identify the
channel to which your `Item <%7B%7Bbase%7D%7D/concepts/items.html>`__
will be linked. These two steps ensure that openHAB can transmit the
information from the `Thing <%7B%7Bbase%7D%7D/concepts/things.html>`__
to the `Item <%7B%7Bbase%7D%7D/concepts/items.html>`__ (and vice versa).

Bindings
~~~~~~~~

Bindings are software packages that are installed by the user in
openHAB. The main purpose of Bindings is to establish the connection
between your device and your
`Thing <%7B%7Bbase%7D%7D/concepts/things.html>`__. Bindings communicate
with your device and translate all commands to and from openHAB between
your device and your `Thing <%7B%7Bbase%7D%7D/concepts/things.html>`__.

Bindings are provided in the `Add-on
section <https://www.openhab.org/addons/>`__ of this website. Here you
will find a searchable list of several hundred bindings to support as
many devices as possible. New bindings are regularly added as developers
integrate more devices into openHAB.

For each binding, detailed instructions and examples are provided that
include guidance on configuration (if any) of the binding itself, the
definition of `Things <%7B%7Bbase%7D%7D/concepts/things.html>`__
supported by this binding and the Channels these
`Things <%7B%7Bbase%7D%7D/concepts/things>`__ provide. In most cases,
the description also contains a fully worked out example that includes a
definition of `Things <%7B%7Bbase%7D%7D/concepts/things>`__ and its
Channels, `Items <%7B%7Bbase%7D%7D/concepts/items.html>`__ linked to
those Channels and the use of these
`Items <%7B%7Bbase%7D%7D/concepts/items.html>`__ in a sitemap.

While You Are Getting Started
-----------------------------

To all newcomers: please read the section `New User
Tutorial <%7B%7Bbase%7D%7D/tutorial>`__. That section provides you with
step-by-step instructions for your first easy setup.

OpenHAB runs on most popular platforms such as Linux, Windows and MacOS
and on almost any hardware ranging from Raspberry Pis to desktop
computers and server PCs. You can find specific installation
instructions for these and other platforms in the `Installation
Overview <%7B%7Bbase%7D%7D/installation/index.html>`__ article. If you
have a strong preference towards a particular platform, then that
platform is probably your best choice.

You can install openHAB on your desktop computer for evaluation purposes
if you already have any of these systems available for use, but we
recommend using a dedicated system in the long run. If you feel serious
about home automation it may be better to start with a dedicated system
right away.

If you have no strong preference, get a `Raspberry Pi
4 <https://www.raspberrypi.org/products/raspberry-pi-4-model-b/>`__ with
2 GB and a 16 GB SD card and install
`openHABian <%7B%7Bbase%7D%7D/installation/openhabian.html>`__ for the
best experience. A RPi 2 or 3 is fine, too, but a RPi4/8GB is overkill,
as are larger SD cards.

While openHABian offers a streamlined and simplified way to get up and
running quickly, it is a complete openHAB home automation system easily
capable of automating your entire home. It is worth noting two potential
limitations of Raspberry Pis, however: RPi 3 and older are limited in
RAM (1 GB of memory or less) and may not perform well when additional
memory hungry applications such as databases and data visualization
programs are being used. Two or more GB should be fine. Running
Raspberries off the internal SD card only may result in system
instabilities as these memory cards can degrade quickly under openHAB’s
use conditions (infamous ‘wearout’). When you choose to deploy
openHABian, there’s the ZRAM feature available to mitigate.

Once you have openHAB up and running, the
`Configuration <%7B%7Bbase%7D%7D/configuration/index.html>`__ article
contains everything you need to know to get your openHAB installation
talking to different devices around your home.

You will quickly discover that you may want to learn more about Things,
Channels, Items, and more. To do so, we highly recommend that you read
the next chapter titled
`Concepts <%7B%7Bbase%7D%7D/concepts/index.html>`__. It provides more
in-depth descriptions of Things, Items, Bindings, etc. that will help
you as you dive deeper into openHAB.

The amount of information provided here can be overwhelming, so please
come back to these sections often as you develop your home automation
system.

Along the way, you may have some questions; the openHAB community is
here to help.

The openHAB Community
---------------------

openHAB is not just software - it is also a **community** of users,
contributors and maintainers, working together on an open-source,
interoperable approach to home automation. The center of this community
is the `openHAB community forum <https://community.openhab.org>`__. It
is an active and responsive community of experienced users who generally
respond quite quickly to forum questions. `Mind the
rules <https://community.openhab.org/t/how-to-ask-a-good-question-help-us-help-you/58396>`__,
please.

Remember that openHAB is an open-source development, driven exclusively
by volunteers. Please be kind and courteous, it will be most appreciated
by those that will try to help you.

In many occasions, you will notice that your problem has already been
raised, discussed and resolved by the community before. You can search
previous conversations and issues to see if your questions have already
been answered. It is best practice and generally considered to be good
etiquette to check fairly thoroughly before posting an own question.

If it is your first time posting a question, please read `How to help us
help
you <https://community.openhab.org/t/how-to-ask-a-good-question-help-us-help-you/58396>`__
to see what information you will need to provide with your post.

Putting it into Practice
------------------------

Once you have got a first overview, it is time to practice. Here a short
list of the steps that you will need to consider to get openHAB up and
running as your home automation system:

1. Install openHAB
2. If you already own a smart device, search the addons for the brand or
   technology used by that device (or simply browse the list of
   `add-ons </addons/>`__ for any technologies or services you may
   recognize)
3. Install a binding (in openHAB)
4. Define a “thing”
5. Add a “channel” to the “thing” if not created by the binding
6. Define an “item”
7. Link the “channel” to your “item”
8. Establish a sitemap

Most of the above can be done in openHAB through point-and-click
processes in a graphical user interface. But remember, there is always
more than one way to achieve your goal in openHAB.

A final word for the DIY enthusiasts. openHAB is very flexible and can
support many DIY devices. However, you will quickly realize that DIY
often literally means that you *“do it yourself”*. Working with DIY
solutions often requires a deeper level of understanding, as well as
more patience and perseverance than the integration of ready-to-use
devices from commercial providers. The choice is yours of course, but
you will need to be prepared to spend either money or time (and
sometimes both) to make your home automation goals a reality. And quite
often, the investment will be significant.

Don’t give up, openHAB is very powerful and flexible and will help you
achieve your home automation goals, whatever they are. But it comes with
a rather steep learning curve.

A Deeper Dive: openHAB Structure for Advanced Users
---------------------------------------------------

openHAB 2 is developed in `Java <https://www.java.com/>`__ and uses
`OSGi <https://www.osgi.org/>`__ for modularity. `Apache
Karaf <http://karaf.apache.org/>`__ serves as a container with `Eclipse
Equinox <https://www.eclipse.org/equinox/>`__ as the OSGi runtime
environment. `Jetty <https://www.eclipse.org/jetty/>`__ is included as
an HTTP server.

openHAB is highly modular software that can be extended through
“Add-ons”. Add-ons give openHAB a wide array of capabilities, from User
Interfaces, to the ability to interact with a large and growing number
of physical Things. Add-ons may come from the openHAB 2 distribution,
the legacy openHAB 1 distribution or from other external sources.

If you are new to openHAB, we suggest you continue to the
`Concepts <%7B%7Bbase%7D%7D/concepts/index.html>`__ chapter where we
introduce many fundamental ideas that are used throughout openHAB.
