Going to begin adding the ability, to this monorepo, to submit evidence of deals and cases to the library.
This included related call recordings, whatsapp and email messages concerning a particular case or deal.
The feature will enable call records, emails, screenshots to be easily parsed and imported into the monorepo. 
And once compiled and submitted via pull request, anyone on the front end can view and export the evidence. 

In the case of emails, we'll likely back the emails up to eml files, then use mhonarc to convert them to static html. 
The evidence relating to a case or past deal will all be linked to a catalogue, using latex/rst/sphinx/ like before. 
The subsequent experience will be the ability to view a deal evidence catalogue (in various languages) and export too. 
In summary the process of collecting and presenting evidence surrounding a particular case or deal can be cumbersome,
and we aim to change that. 

Needless to say there's ERP/CMS systems which can do this without a sweat e.g. salesforce.
But where DATRO is different is that it's free, decentralised/ federated and subsequently sovereign. 
Eventually the dependancies can be made into submodules of the monorepo (which a package.json can point to (file:) )
And like an Inverse Oroborous or Aleph-Tav the self-build arm/x64 script will permit the same homeserver being built, to build/ maintain it.

Here's the starting point for mhonarc;

```
# turns all the eml files into html 
mhonarc *.eml
```

```
# adds css 
mhonarc -single -rcfile custom.rc -cssfile custom.css your_email.eml
```

