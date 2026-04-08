
#!/bin/sh

# Assume running from webroot
# Create top-level directories
mkdir -p img
mkdir -p txt
mkdir -p md
mkdir -p pdf
mkdir -p csv

# List of subfolders to create
folders="slide-01-1215
slide-02-1539
slide-03-1543
slide-04-1552
slide-05-1667
slide-06-1728
slide-07-1770
slide-08-1780
slide-09-1794
slide-10-1818
slide-11-1819
slide-12-1820
slide-13-1821
slide-14-1824
slide-15-1845
slide-16-1850
slide-17-1855
slide-18-1870
slide-19-1880
slide-20-1886
slide-21-1888
slide-22-1893
slide-23-1894
slide-24-1895
slide-25-1897
slide-26-1900
slide-27-1915
slide-28-1916
slide-29-1924
slide-30-1925
slide-31-1926
slide-32-1930
slide-33-1935
slide-34-1938
slide-35-1939
slide-36-1948
slide-37-1949
slide-38-1950
slide-39-1952
slide-40-1953
slide-41-1955
slide-42-1959
slide-43-1960
slide-44-1962
slide-45-1963
slide-46-1964
slide-47-1965
slide-48-1969
slide-49-1970
slide-50-1974
slide-51-1978
slide-52-1980
slide-53-1982
slide-54-1983
slide-55-1984
slide-56-1987
slide-57-1988
slide-58-1989
slide-59-1990
slide-60-1994
slide-61-2024
slide-62-0340"

# Create subfolders in each top-level directory
for folder in $folders; do
    mkdir -p "img/$folder"
    mkdir -p "txt/$folder"
    mkdir -p "md/$folder"
    mkdir -p "pdf/$folder"
    mkdir -p "csv/$folder"
done

echo "Directory structure created successfully."
