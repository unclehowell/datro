import React from "react";
import styled from "styled-components";

export default styled(({ className, data, limit, page, setPage }) => {
  const pages = [];

  for (let i = 1; i <= Math.floor(data.length / limit); i++) {
    let style = null;
    if (page === i) style = { fontWeight: "bold" };
    pages.push(
      <div onClick={() => setPage(i)} style={style} key={i}>
        {i}
      </div>
    );
  }

  const start = Math.min(
    Math.max(0, page - 3),
    Math.max(0, Math.floor(data.length / limit) - 5)
  );

  const end = Math.min(start + 5, Math.floor(data.length / limit));

  if (pages.length <= 1) return null;

  return (
    <div className={className + " d-flex justify-content-center text-center"}>
      <div
        onClick={() => setPage(page - 1)}
        className={page <= 1 ? "disabled" : null}
      >
        &laquo;
      </div>
      {pages.length > 1 && pages.slice(start, end)}
      <div
        onClick={() => setPage(page + 1)}
        className={(page + 1) * limit >= data.length ? "disabled" : null}
      >
        &raquo;
      </div>
    </div>
  );
})`
  > div {
    border: 1px solid #dadada;
    width: 40px;
    height: 40px;
    padding-top: 9px;
    margin-left: -1px;
    font-size: 14px;
    color: blue;
    cursor: pointer;

    &.disabled {
      opacity: 0.4;
      pointer-events: none;
    }

    &:first-child {
      border-radius: 3px;
      border-right: none;
    }

    &:last-child {
      border-left: none;
      border-radius: 3px;
      padding-left: 4px;
      margin-left: -3px;
    }
  }
`;
